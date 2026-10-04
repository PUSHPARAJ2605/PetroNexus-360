import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Camera,
  Layers,
  Activity,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Play,
  Pause,
  Sliders,
  ChevronRight,
  Info,
  Radio,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FastForward,
  Gauge,
  Thermometer,
  Droplet
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface DigitalTwin3DProps {
  liveState: any;
  isSimulatedMode: boolean;
  isUnsafe: boolean;
  metrics: any;
  simSummary: any;
  onAssetClick: (tag: string) => void;
  selectedTag?: string;
}

interface HUDPin {
  tag: string;
  title: string;
  subtitle: string;
  metric: string;
  subMetric?: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  color: string;
  worldPos: THREE.Vector3;
  screenPos: { x: number; y: number; visible: boolean };
}

export const DigitalTwin3D: React.FC<DigitalTwin3DProps> = ({
  liveState,
  isSimulatedMode,
  isUnsafe,
  metrics,
  simSummary,
  onAssetClick,
  selectedTag = 'IW-01',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const [activeCamPreset, setActiveCamPreset] = useState<'schematic' | 'orbit' | 'boiler' | 'reservoir' | 'pump' | 'tank'>('schematic');
  const [labelMode, setLabelMode] = useState<'clean' | 'micro' | 'detailed'>('micro');
  const [hoveredPinTag, setHoveredPinTag] = useState<string | null>(null);
  const [flowSpeedMultiplier, setFlowSpeedMultiplier] = useState<number>(1.0);
  const [isFlowPlaying, setIsFlowPlaying] = useState<boolean>(true);
  const [hudPins, setHudPins] = useState<HUDPin[]>([]);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const interactablesRef = useRef<{ [tag: string]: THREE.Object3D }>({});
  
  // Smooth Camera Tweening
  const camTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 42, 38));
  const controlsTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isCameraTweeningRef = useRef<boolean>(true);

  // Dynamic Pin Definitions
  const pinsDataRef = useRef<{
    tag: string;
    title: string;
    subtitle: string;
    getMetric: () => string;
    getSubMetric?: () => string;
    getStatus: () => 'NORMAL' | 'WARNING' | 'CRITICAL';
    color: string;
    worldPos: THREE.Vector3;
  }[]>([]);

  // Kinematic elements for dynamic runtime updates
  const kinematicRefs = useRef<{
    walkingBeam?: THREE.Group;
    crankL?: THREE.Group;
    crankR?: THREE.Group;
    pitmanL?: THREE.Mesh;
    pitmanR?: THREE.Mesh;
    polishedRod?: THREE.Mesh;
    carrierBar?: THREE.Mesh;
    bridleL?: THREE.Mesh;
    bridleR?: THREE.Mesh;
    burnerLight?: THREE.PointLight;
    thermalSteamCore?: THREE.Mesh;
    thermalFront?: THREE.Mesh;
    thermalShell?: THREE.Mesh;
    thermalWave1?: THREE.Mesh;
    thermalWave2?: THREE.Mesh;
    thermalWave3?: THREE.Mesh;
    suctionRings?: THREE.Mesh[];
    reservoirLight?: THREE.PointLight;
    subsurfacePoints?: THREE.Points;
    subsurfaceProgress?: Float32Array;
    subsurfacePaths?: THREE.Vector3[][];
    steamMistPoints?: THREE.Points;
    steamMistProgress?: Float32Array;
    steamMistOrigins?: THREE.Vector3[];
    steamMistDirs?: THREE.Vector3[];
    oilSeepagePoints?: THREE.Points;
    oilSeepageProgress?: Float32Array;
    oilSeepageStarts?: THREE.Vector3[];
    oilSeepageTargets?: THREE.Vector3[];
    oilLiquidMesh?: THREE.Mesh;
    oilIridescenceTex?: THREE.CanvasTexture;
    oilViscousEddies?: { mesh: THREE.Mesh; baseScale: number; speed: number; rotSpeed: number; centerX: number; centerZ: number; angle: number }[];
    oilMigrationPoints?: THREE.Points;
    oilMigrationData?: { x: Float32Array; y: Float32Array; z: Float32Array; speed: Float32Array };
    floatingOilBlobs?: THREE.Mesh[];
    floatingOilBaseY?: number[];
    // Volumetric Steam Chest & Thermal Liquefaction Front
    steamChestCore?: THREE.Mesh;
    steamChestCoreTex?: THREE.CanvasTexture;
    steamChestPlumes?: THREE.Mesh[];
    steamBlanket?: THREE.Mesh;
    steamBlanketBaseY?: Float32Array;
    thermalMeltZone?: THREE.Mesh;
    thermalHeatWaves?: { mesh: THREE.Mesh; phase: number; baseScale: number }[];
    boilMicroRings?: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; centerX: number; centerZ: number }[];
    steamMistVaporPoints?: THREE.Points;
    steamMistData?: {
      x: Float32Array;
      y: Float32Array;
      z: Float32Array;
      vx: Float32Array;
      vy: Float32Array;
      vz: Float32Array;
      life: Float32Array;
      maxLife: Float32Array;
      baseScale: Float32Array;
    };
    steamInjectionLight?: THREE.PointLight;
    windStreamlines?: THREE.Mesh[];
    windStreamlineTexs?: THREE.CanvasTexture[];
    windParticles?: THREE.Points;
    windProgress?: Float32Array;
    windCurveIndices?: number[];
    windCurves?: THREE.CatmullRomCurve3[];
    boilRings?: THREE.Mesh[];
    caprockBreachRing?: THREE.Mesh;
    fractureVeins?: THREE.Group;
    steamParticles1?: THREE.Points;
    steamParticles2?: THREE.Points;
    oilParticles?: THREE.Points;
    stackPlume?: THREE.Points;
    tankLiquidMesh?: THREE.Mesh;
    dashedSteamTex1?: THREE.CanvasTexture;
    dashedSteamTex2?: THREE.CanvasTexture;
    dashedOilTex?: THREE.CanvasTexture;
    beaconRings?: THREE.Mesh[];
  }>({});

  // Procedural Canvas Textures
  const textures = useMemo(() => {
    // 1. High-Intensity Continuous Glowing Fluid Flow Ribbon (Unbroken, Non-segmented)
    const createFlowRibbon = (glowColor: string, coreColor: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 512, 64);

      // Continuous unbroken luminous fluid stream
      const baseGrad = ctx.createLinearGradient(0, 0, 0, 64);
      baseGrad.addColorStop(0, 'rgba(0,0,0,0)');
      baseGrad.addColorStop(0.2, glowColor);
      baseGrad.addColorStop(0.5, glowColor);
      baseGrad.addColorStop(0.8, glowColor);
      baseGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 4, 512, 56);

      // Continuous brilliant core line
      const coreGrad = ctx.createLinearGradient(0, 0, 0, 64);
      coreGrad.addColorStop(0, 'rgba(0,0,0,0)');
      coreGrad.addColorStop(0.35, coreColor);
      coreGrad.addColorStop(0.5, '#FFFFFF');
      coreGrad.addColorStop(0.65, coreColor);
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 18, 512, 28);

      // Smooth subtle flowing energy waves along the stream
      for (let x = 0; x < 512; x += 128) {
        const pulseGrad = ctx.createRadialGradient(x + 64, 32, 2, x + 64, 32, 60);
        pulseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        pulseGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
        pulseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = pulseGrad;
        ctx.fillRect(x, 10, 128, 44);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 1);
      return tex;
    };

    const dashedCyanTex = createFlowRibbon('rgba(6, 182, 212, 0.85)', '#FFFFFF');
    const dashedWhiteTex = createFlowRibbon('rgba(255, 255, 255, 0.95)', '#FFFFFF');
    const dashedRedTex = createFlowRibbon('rgba(244, 63, 94, 0.95)', '#FFD1D9');
    const dashedAmberTex = createFlowRibbon('rgba(245, 158, 11, 0.85)', '#FFFBEB');

    // 2. Industrial Hazard Caution Border (Yellow / Black Diagonal)
    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 128;
    hazardCanvas.height = 128;
    const hctx = hazardCanvas.getContext('2d')!;
    hctx.fillStyle = '#EAB308';
    hctx.fillRect(0, 0, 128, 128);
    hctx.fillStyle = '#0F172A';
    hctx.beginPath();
    for (let i = -128; i < 256; i += 32) {
      hctx.moveTo(i, 0);
      hctx.lineTo(i + 32, 0);
      hctx.lineTo(i + 32 + 128, 128);
      hctx.lineTo(i + 128, 128);
      hctx.closePath();
    }
    hctx.fill();
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.wrapT = THREE.RepeatWrapping;
    hazardTex.repeat.set(8, 1);

    // 3. Technical Blueprint Concrete Ground Texture
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 512;
    bgCanvas.height = 512;
    const bctx = bgCanvas.getContext('2d')!;
    bctx.fillStyle = '#030811';
    bctx.fillRect(0, 0, 512, 512);

    bctx.strokeStyle = '#081E33';
    bctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      bctx.beginPath();
      bctx.moveTo(i, 0);
      bctx.lineTo(i, 512);
      bctx.stroke();
      bctx.beginPath();
      bctx.moveTo(0, i);
      bctx.lineTo(512, i);
      bctx.stroke();
    }
    bctx.strokeStyle = '#0E365C';
    bctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 128) {
      bctx.strokeRect(i, 0, 128, 512);
      bctx.strokeRect(0, i, 512, 128);
    }
    const bgTex = new THREE.CanvasTexture(bgCanvas);
    bgTex.wrapS = THREE.RepeatWrapping;
    bgTex.wrapT = THREE.RepeatWrapping;
    bgTex.repeat.set(16, 12);

    // 4. Circular Holographic Ground Target Projector
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 256;
    ringCanvas.height = 256;
    const rctx = ringCanvas.getContext('2d')!;
    rctx.clearRect(0, 0, 256, 256);
    rctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    rctx.lineWidth = 4;
    rctx.beginPath();
    rctx.arc(128, 128, 110, 0, Math.PI * 2);
    rctx.stroke();
    rctx.setLineDash([12, 16]);
    rctx.lineWidth = 2;
    rctx.beginPath();
    rctx.arc(128, 128, 85, 0, Math.PI * 2);
    rctx.stroke();
    const holoRingTex = new THREE.CanvasTexture(ringCanvas);

    // 5. Walking Beam "PETRONEXUS HD-320" Steel Stencil Plaque Texture
    const beamLogoCanvas = document.createElement('canvas');
    beamLogoCanvas.width = 512;
    beamLogoCanvas.height = 64;
    const blctx = beamLogoCanvas.getContext('2d')!;
    blctx.fillStyle = '#1E293B';
    blctx.fillRect(0, 0, 512, 64);
    blctx.strokeStyle = '#0284C7';
    blctx.lineWidth = 4;
    blctx.strokeRect(6, 6, 500, 52);
    blctx.fillStyle = '#38BDF8';
    blctx.font = 'bold 28px monospace';
    blctx.textAlign = 'center';
    blctx.textBaseline = 'middle';
    blctx.fillText('PETRONEXUS  HD-320', 256, 32);
    const beamLogoTex = new THREE.CanvasTexture(beamLogoCanvas);

    // 6. Soft Radial Glowing Particle Dot Texture
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 64;
    dotCanvas.height = 64;
    const dctx = dotCanvas.getContext('2d')!;
    const dotGrad = dctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    dotGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    dotGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
    dotGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.35)');
    dotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dctx.fillStyle = dotGrad;
    dctx.beginPath();
    dctx.arc(32, 32, 30, 0, Math.PI * 2);
    dctx.fill();
    const glowDotTex = new THREE.CanvasTexture(dotCanvas);

    // 7. Soft Aerodynamic Wind Wisp Texture for Steam Currents
    const windCanvas = document.createElement('canvas');
    windCanvas.width = 512;
    windCanvas.height = 64;
    const wctx = windCanvas.getContext('2d')!;
    wctx.fillStyle = 'rgba(0, 0, 0, 0)';
    wctx.fillRect(0, 0, 512, 64);
    for (let x = 0; x < 512; x += 128) {
      const grad = wctx.createLinearGradient(x, 0, x + 120, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.65)');
      grad.addColorStop(0.7, 'rgba(224, 242, 254, 0.90)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      wctx.fillStyle = grad;
      wctx.beginPath();
      wctx.ellipse(x + 60, 32, 58, 22, 0, 0, Math.PI * 2);
      wctx.fill();
    }
    const windWispTex = new THREE.CanvasTexture(windCanvas);
    windWispTex.wrapS = THREE.RepeatWrapping;
    windWispTex.wrapT = THREE.RepeatWrapping;
    windWispTex.repeat.set(4, 1);

    // 8. Superheated Steam Jet Core Flow Texture (High velocity stream ribbons)
    const jetCanvas = document.createElement('canvas');
    jetCanvas.width = 512;
    jetCanvas.height = 256;
    const jctx = jetCanvas.getContext('2d')!;
    jctx.fillStyle = 'rgba(0, 0, 0, 0)';
    jctx.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 64) {
      const jGrad = jctx.createLinearGradient(0, y, 512, y + 64);
      jGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      jGrad.addColorStop(0.25, 'rgba(224, 242, 254, 0.85)');
      jGrad.addColorStop(0.65, 'rgba(186, 230, 253, 0.50)');
      jGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      jctx.fillStyle = jGrad;
      jctx.fillRect(0, y + 8, 512, 48);
    }
    const steamJetFlowTex = new THREE.CanvasTexture(jetCanvas);
    steamJetFlowTex.wrapS = THREE.RepeatWrapping;
    steamJetFlowTex.wrapT = THREE.RepeatWrapping;
    steamJetFlowTex.repeat.set(1, 4);

    // 9. Volumetric Soft Steam Vapor Texture (Gaussian atmospheric cloud puff)
    const vaporCanvas = document.createElement('canvas');
    vaporCanvas.width = 256;
    vaporCanvas.height = 256;
    const vctx = vaporCanvas.getContext('2d')!;
    const vGrad = vctx.createRadialGradient(128, 128, 12, 128, 128, 126);
    vGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    vGrad.addColorStop(0.3, 'rgba(240, 249, 255, 0.70)');
    vGrad.addColorStop(0.65, 'rgba(186, 230, 253, 0.35)');
    vGrad.addColorStop(0.85, 'rgba(125, 211, 252, 0.12)');
    vGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    vctx.fillStyle = vGrad;
    vctx.beginPath();
    vctx.arc(128, 128, 126, 0, Math.PI * 2);
    vctx.fill();
    const steamVaporTex = new THREE.CanvasTexture(vaporCanvas);

    // 10. Thermal Melting & Liquefaction Zone Texture (Molten Gold / Radiant Amber)
    const meltCanvas = document.createElement('canvas');
    meltCanvas.width = 256;
    meltCanvas.height = 256;
    const mctx = meltCanvas.getContext('2d')!;
    const mGrad = mctx.createRadialGradient(128, 128, 6, 128, 128, 124);
    mGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');       // Pure incandescent core
    mGrad.addColorStop(0.18, 'rgba(254, 240, 138, 0.95)');   // Hot molten yellow #FEF08A
    mGrad.addColorStop(0.42, 'rgba(245, 158, 11, 0.85)');    // Radiant amber #F59E0B
    mGrad.addColorStop(0.70, 'rgba(234, 88, 12, 0.55)');     // Fiery orange #EA580C
    mGrad.addColorStop(0.88, 'rgba(185, 28, 28, 0.22)');     // Infrared boundary #B91C1C
    mGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');             // Obsidian blend
    mctx.fillStyle = mGrad;
    mctx.beginPath();
    mctx.arc(128, 128, 124, 0, Math.PI * 2);
    mctx.fill();
    const thermalMeltGlowTex = new THREE.CanvasTexture(meltCanvas);

    // 11. Thermal Heat Dissipation Ring Wave Texture
    const waveCanvas = document.createElement('canvas');
    waveCanvas.width = 256;
    waveCanvas.height = 256;
    const wvctx = waveCanvas.getContext('2d')!;
    const wvGrad = wvctx.createRadialGradient(128, 128, 80, 128, 128, 124);
    wvGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    wvGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.15)');
    wvGrad.addColorStop(0.8, 'rgba(254, 240, 138, 0.85)');
    wvGrad.addColorStop(0.92, 'rgba(255, 255, 255, 0.95)');
    wvGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    wvctx.fillStyle = wvGrad;
    wvctx.beginPath();
    wvctx.arc(128, 128, 124, 0, Math.PI * 2);
    wvctx.fill();
    const thermalWaveRingTex = new THREE.CanvasTexture(waveCanvas);

    // 12. Petroleum Thin-Film Iridescence Texture (Obsidian Peacock Hydrocarbon Sheen)
    const iriCanvas = document.createElement('canvas');
    iriCanvas.width = 512;
    iriCanvas.height = 512;
    const ictx = iriCanvas.getContext('2d')!;
    ictx.fillStyle = '#060302';
    ictx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) {
      const cy = 20 + i * 65;
      const igrad = ictx.createLinearGradient(0, cy, 512, cy + 45);
      igrad.addColorStop(0, 'rgba(6, 3, 2, 0.95)');
      igrad.addColorStop(0.25, 'rgba(217, 119, 6, 0.35)');  // Molten amber
      igrad.addColorStop(0.5, 'rgba(8, 145, 178, 0.25)');   // Petroleum cyan sheen
      igrad.addColorStop(0.75, 'rgba(168, 85, 247, 0.18)'); // Hydrocarbon violet
      igrad.addColorStop(1, 'rgba(6, 3, 2, 0.95)');
      ictx.fillStyle = igrad;
      ictx.fillRect(0, cy - 15, 512, 75);
    }
    const oilIridescenceTex = new THREE.CanvasTexture(iriCanvas);
    oilIridescenceTex.wrapS = THREE.RepeatWrapping;
    oilIridescenceTex.wrapT = THREE.RepeatWrapping;
    oilIridescenceTex.repeat.set(2, 2);

    // 13. Viscous Hydrocarbon Eddy / Swirl Vortex Texture (Feathered Liquid Discs)
    const eddyCanvas = document.createElement('canvas');
    eddyCanvas.width = 256;
    eddyCanvas.height = 256;
    const ectx = eddyCanvas.getContext('2d')!;
    const egrad = ectx.createRadialGradient(128, 128, 4, 128, 128, 124);
    egrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');   // Warm amber center
    egrad.addColorStop(0.35, 'rgba(180, 83, 9, 0.32)');  // Rich bronze
    egrad.addColorStop(0.70, 'rgba(14, 116, 144, 0.18)'); // Petrol-cyan sheen edge
    egrad.addColorStop(1, 'rgba(0, 0, 0, 0)');          // Transparent falloff
    ectx.fillStyle = egrad;
    ectx.beginPath();
    ectx.arc(128, 128, 124, 0, Math.PI * 2);
    ectx.fill();
    const oilEddyTex = new THREE.CanvasTexture(eddyCanvas);

    return {
      dashedCyanTex,
      dashedWhiteTex,
      dashedRedTex,
      dashedAmberTex,
      hazardTex,
      bgTex,
      holoRingTex,
      beamLogoTex,
      glowDotTex,
      windWispTex,
      steamJetFlowTex,
      steamVaporTex,
      thermalMeltGlowTex,
      thermalWaveRingTex,
      oilIridescenceTex,
      oilEddyTex,
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 660;

    // -------------------------------------------------------------------------
    // 1. SCENE SETUP
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#020710');
    scene.fog = new THREE.FogExp2('#020710', 0.0065);

    // -------------------------------------------------------------------------
    // 2. CAMERA SETUP
    // -------------------------------------------------------------------------
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 42, 38);

    // -------------------------------------------------------------------------
    // 3. RENDERER SETUP (PBR, Soft Shadows, ACES Filmic Tone Mapping)
    // -------------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // 4. ORBIT CONTROLS
    // -------------------------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.minDistance = 12;
    controls.maxDistance = 140;
    controls.target.set(0, 0, 0);

    // Track user manual interaction to cease auto-tweening
    controls.addEventListener('start', () => {
      isCameraTweeningRef.current = false;
    });

    // -------------------------------------------------------------------------
    // 5. INDUSTRIAL ILLUMINATION (Refinery Key + Front Fill + Cyan/Amber Rim Lights)
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight('#1E3A5F', 2.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#F8FAFC', 2.8);
    sunLight.position.set(25, 55, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Front Camera Fill Light (Ensures equipment faces are never in dark shadow!)
    const frontFill = new THREE.DirectionalLight('#E0F2FE', 2.0);
    frontFill.position.set(0, 35, 45);
    scene.add(frontFill);

    // Electric Cyan Rim Light
    const rimCyan = new THREE.DirectionalLight('#00F0FF', 1.8);
    rimCyan.position.set(-40, 25, -40);
    scene.add(rimCyan);

    // Warm Sodium Glow
    const sodiumLight = new THREE.DirectionalLight('#F59E0B', 1.4);
    sodiumLight.position.set(40, 20, 30);
    scene.add(sodiumLight);

    // Boiler Burner Flame Light
    const burnerLight = new THREE.PointLight('#FF5500', 4.5, 22);
    burnerLight.position.set(-22, 2.8, -5);
    scene.add(burnerLight);
    kinematicRefs.current.burnerLight = burnerLight;

    // -------------------------------------------------------------------------
    // 6. SHARED PBR INDUSTRIAL MATERIALS (High Visibility / Contrast)
    // -------------------------------------------------------------------------
    // High-Visibility Dedicated Materials for Tank, Pumpjack, and Boiler
    const matTankShell = new THREE.MeshStandardMaterial({
      color: '#EA580C', // Vibrant Industrial Safety Amber/Orange (Matches Crude Loop)
      metalness: 0.35,
      roughness: 0.35,
      emissive: '#7C2D12',
      emissiveIntensity: 0.12,
    });

    const matTankRoof = new THREE.MeshStandardMaterial({
      color: '#1E293B', // Slate Charcoal Steel Conical Dome
      metalness: 0.75,
      roughness: 0.28,
    });

    const matPumpBeam = new THREE.MeshStandardMaterial({
      color: '#F59E0B', // Safety Golden Amber Walking Beam
      metalness: 0.45,
      roughness: 0.25,
      emissive: '#B45309',
      emissiveIntensity: 0.25,
    });

    const matPumpPost = new THREE.MeshStandardMaterial({
      color: '#0284C7', // Industrial Refinery Cyan-Blue Samson Post
      metalness: 0.55,
      roughness: 0.28,
    });

    const matBoilerJacket = new THREE.MeshStandardMaterial({
      color: '#0284C7', // Electric Industrial Cobalt Blue (Full Body, matches reference)
      metalness: 0.58,
      roughness: 0.22,
      emissive: '#0369A1',
      emissiveIntensity: 0.22,
    });

    const matBoilerTrim = new THREE.MeshStandardMaterial({
      color: '#0369A1', // Deep Cerulean End Caps & Discharge Trim
      metalness: 0.65,
      roughness: 0.2,
      emissive: '#0284C7',
      emissiveIntensity: 0.28,
    });

    const matStackSteel = new THREE.MeshStandardMaterial({
      color: '#94A3B8', // Clean Galvanized Steel
      metalness: 0.6,
      roughness: 0.28,
    });

    const matVesselSteel = new THREE.MeshStandardMaterial({
      color: '#1E3E62',
      metalness: 0.82,
      roughness: 0.28,
    });

    const matDarkHull = new THREE.MeshStandardMaterial({
      color: '#1E293B', // Upgraded from #0A1828 so structural parts are clearly visible!
      metalness: 0.8,
      roughness: 0.3,
    });

    const matChrome = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      metalness: 0.98,
      roughness: 0.08,
    });

    const matSafetyYellow = new THREE.MeshStandardMaterial({
      color: '#EAB308',
      metalness: 0.5,
      roughness: 0.35,
    });

    const matValveRed = new THREE.MeshStandardMaterial({
      color: '#EF4444',
      metalness: 0.6,
      roughness: 0.25,
    });

    const matConcrete = new THREE.MeshStandardMaterial({
      color: '#334155', // Lighter architectural concrete
      roughness: 0.85,
      metalness: 0.05,
    });

    const matCaution = new THREE.MeshStandardMaterial({
      map: textures.hazardTex,
      roughness: 0.5,
    });

    const matOilPipe = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      metalness: 0.85,
      roughness: 0.2,
      emissive: '#B45309',
      emissiveIntensity: 0.35,
    });

    const matGlass = new THREE.MeshStandardMaterial({
      color: '#38BDF8',
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.35,
    });

    const interactables: { [tag: string]: THREE.Object3D } = {};
    const pinsData: typeof pinsDataRef.current = [];
    const beaconRings: THREE.Mesh[] = [];

    // Helper: Build Concrete Equipment Pad with Hazard Trim & Holographic Projector
    const addEquipmentPad = (x: number, z: number, w: number, d: number, h: number = 0.4) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(x, h / 2, z);

      const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matConcrete);
      slab.castShadow = true;
      slab.receiveShadow = true;
      padGroup.add(slab);

      // Yellow/Black Hazard Border Strip
      const borderTop = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.2), matCaution);
      borderTop.position.set(0, h / 2 + 0.01, -d / 2 + 0.1);
      padGroup.add(borderTop);

      const borderBot = borderTop.clone();
      borderBot.position.set(0, h / 2 + 0.01, d / 2 - 0.1);
      padGroup.add(borderBot);

      // Holographic Floor Ring Projector
      const ringMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(w, d) * 1.25, Math.max(w, d) * 1.25),
        new THREE.MeshBasicMaterial({
          map: textures.holoRingTex,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.03;
      padGroup.add(ringMesh);
      beaconRings.push(ringMesh);

      scene.add(padGroup);
      return padGroup;
    };

    // -------------------------------------------------------------------------
    // 7. FACILITY BLUEPRINT FLOOR
    // -------------------------------------------------------------------------
    const groundGeo = new THREE.PlaneGeometry(86, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      map: textures.bgTex,
      roughness: 0.72,
      metalness: 0.22,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Glowing Neon Blueprint Field Boundary
    const borderGeo = new THREE.BoxGeometry(84, 0.15, 0.3);
    const borderMat = new THREE.MeshBasicMaterial({ color: '#0284C7' });
    const bTop = new THREE.Mesh(borderGeo, borderMat);
    bTop.position.set(0, 0.08, -28);
    scene.add(bTop);
    const bBot = bTop.clone();
    bBot.position.set(0, 0.08, 28);
    scene.add(bBot);

    // =========================================================================
    // 8. ASSET: SG-01 OTSG BOILER (Horizontal Pressure Vessel, Flue, Burner)
    // Located at X = -22, Z = -5 (Exact 2D Layout Position)
    // =========================================================================
    const sgGroup = new THREE.Group();
    sgGroup.position.set(-22, 0, -5);
    addEquipmentPad(-22, -5, 10, 7, 0.5);

    // Twin Foundation Saddle Blocks
    const saddle1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 4.4), matConcrete);
    saddle1.position.set(-2.6, 0.8, 0);
    saddle1.castShadow = true;
    sgGroup.add(saddle1);
    const saddle2 = saddle1.clone();
    saddle2.position.set(2.6, 0.8, 0);
    sgGroup.add(saddle2);

    // Boiler Drum Body (Bright Insulated Aluminum Jacket)
    const sgDrumGeo = new THREE.CylinderGeometry(2.1, 2.1, 7.8, 32);
    sgDrumGeo.rotateZ(Math.PI / 2);
    const sgDrum = new THREE.Mesh(sgDrumGeo, matBoilerJacket);
    sgDrum.position.set(0, 2.8, 0);
    sgDrum.castShadow = true;
    sgDrum.receiveShadow = true;
    sgGroup.add(sgDrum);

    // Domed Hemispherical Ends (Vibrant Cyan-Teal)
    const domeGeo = new THREE.SphereGeometry(2.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeL = new THREE.Mesh(domeGeo, matBoilerTrim);
    domeL.rotation.z = Math.PI / 2;
    domeL.position.set(-3.9, 2.8, 0);
    sgGroup.add(domeL);

    const domeR = new THREE.Mesh(domeGeo, matBoilerTrim);
    domeR.rotation.z = -Math.PI / 2;
    domeR.position.set(3.9, 2.8, 0);
    sgGroup.add(domeR);

    // Weld Stiffener Rings (Polished Chrome)
    for (let x = -2.6; x <= 2.6; x += 1.3) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.14, 0.06, 12, 32), matChrome);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(x, 2.8, 0);
      sgGroup.add(ring);
    }

    // Burner Flange & Flame Inspection Port (Left End)
    const burnerFace = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 1.2, 24), matBoilerTrim);
    burnerFace.rotation.z = Math.PI / 2;
    burnerFace.position.set(-4.5, 2.8, 0);
    sgGroup.add(burnerFace);

    const flameSight = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 20),
      new THREE.MeshBasicMaterial({ color: '#FF7700' })
    );
    flameSight.rotation.y = -Math.PI / 2;
    flameSight.position.set(-5.12, 2.8, 0);
    sgGroup.add(flameSight);

    // Vertical Exhaust Flue Stack with Safety Ladder
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 8.5, 24), matStackSteel);
    stack.position.set(2.4, 7.05, 0);
    stack.castShadow = true;
    sgGroup.add(stack);

    // Top Steam Dome & Discharge Nozzle (Exits right toward SP-01 & SP-02)
    const steamDome = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.0, 20), matBoilerTrim);
    steamDome.position.set(-0.8, 5.2, 0);
    sgGroup.add(steamDome);

    const reliefValve = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), matValveRed);
    reliefValve.position.set(-0.8, 6.0, 0);
    sgGroup.add(reliefValve);

    sgGroup.userData = { tag: 'SG-01', name: 'OTSG BOILER SG-01' };
    scene.add(sgGroup);
    interactables['SG-01'] = sgGroup;

    pinsData.push({
      tag: 'SG-01',
      title: 'SG-01',
      subtitle: 'OTSG BOILER',
      getMetric: () => isSimulatedMode ? `${metrics.steamFlowRate} t/h • ${metrics.steamPressure} bar` : '88.0 bar • 289°C',
      getStatus: () => liveState?.assets['SG-01']?.status || 'NORMAL',
      color: '#06B6D4',
      worldPos: new THREE.Vector3(-22, 6.5, -5)
    });

    // =========================================================================
    // 9. CONTINUOUS INDUSTRIAL PIPELINE SYSTEM & HELPERS
    // Solves all disconnected pipes: builds uninterrupted flanged steel conduits
    // with 90° corner elbow spheres, weld collars, and elevated support racks!
    // =========================================================================
    const sp02Warning = isUnsafe || liveState?.assets['SP-02']?.status === 'WARNING';

    // Pipe Materials
    const matPipeCyan = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      metalness: 0.65,
      roughness: 0.2,
      transparent: true,
      opacity: 0.72,
      emissive: '#0369A1',
      emissiveIntensity: 0.35,
    });

    const matPipeSP02 = new THREE.MeshStandardMaterial({
      color: sp02Warning ? '#F43F5E' : '#0284C7',
      metalness: 0.65,
      roughness: 0.2,
      transparent: true,
      opacity: 0.72,
      emissive: sp02Warning ? '#BE123C' : '#0369A1',
      emissiveIntensity: sp02Warning ? 0.75 : 0.35,
    });

    const matPipeOilLine = new THREE.MeshStandardMaterial({
      color: '#854D0E',
      metalness: 0.65,
      roughness: 0.25,
      transparent: true,
      opacity: 0.72,
      emissive: '#B45309',
      emissiveIntensity: 0.35,
    });

    const matPipeFitting = new THREE.MeshStandardMaterial({
      color: '#475569',
      metalness: 0.9,
      roughness: 0.15,
    });

    // Helper: Generate Smooth Corner Waypoints for Catmull-Rom Centripetal Spline
    // Prevents parabolic mid-air overshooting and keeps fluid 100% inside physical pipes!
    const generateBeveledSpline = (waypoints: THREE.Vector3[], cornerRadius = 0.45): THREE.Vector3[] => {
      const result: THREE.Vector3[] = [];
      if (waypoints.length < 2) return waypoints;

      result.push(waypoints[0].clone());
      for (let i = 1; i < waypoints.length - 1; i++) {
        const prev = waypoints[i - 1];
        const curr = waypoints[i];
        const next = waypoints[i + 1];

        const dIn = new THREE.Vector3().subVectors(curr, prev);
        const lenIn = dIn.length();
        const dOut = new THREE.Vector3().subVectors(next, curr);
        const lenOut = dOut.length();

        if (lenIn < 0.001 || lenOut < 0.001) {
          result.push(curr.clone());
          continue;
        }

        const vIn = dIn.clone().normalize();
        const vOut = dOut.clone().normalize();
        const dot = vIn.dot(vOut);

        if (dot > 0.99) {
          result.push(curr.clone());
        } else {
          const r = Math.min(cornerRadius, lenIn * 0.35, lenOut * 0.35);
          const pIn = curr.clone().sub(vIn.clone().multiplyScalar(r));
          const pOut = curr.clone().add(vOut.clone().multiplyScalar(r));
          result.push(pIn);
          result.push(pOut);
        }
      }
      result.push(waypoints[waypoints.length - 1].clone());
      return result;
    };

    // Helper: Construct Continuous Seamless Physical Pipeline along 3D Waypoints
    const buildContinuousIndustrialPipeline = (
      points: THREE.Vector3[],
      radius: number,
      pipeMat: THREE.Material,
      fittingMat: THREE.Material,
      options?: {
        addIntermediateFlanges?: boolean;
        addGroundSupports?: boolean;
        groundY?: number;
      }
    ) => {
      const pipeGroup = new THREE.Group();
      const elbowRadius = radius * 1.08;
      const flangeRadius = radius * 1.28;
      const flangeLength = 0.12;

      // 1. Place Corner Elbow Spheres & Double Flange Rings at true internal bends
      for (let i = 1; i < points.length - 1; i++) {
        const pPrev = points[i - 1];
        const pCurr = points[i];
        const pNext = points[i + 1];

        const dIn = new THREE.Vector3().subVectors(pCurr, pPrev);
        const dOut = new THREE.Vector3().subVectors(pNext, pCurr);
        if (dIn.length() < 0.01 || dOut.length() < 0.01) continue;

        const vIn = dIn.clone().normalize();
        const vOut = dOut.clone().normalize();

        // Skip straight collinear segments (prevents accidental flanges/elbows on straight spans)
        if (vIn.dot(vOut) > 0.98) continue;

        const isSubsurfaceBend = pCurr.y < -0.5;
        const curElbowRadius = isSubsurfaceBend ? 0.135 : elbowRadius;

        // Corner Elbow Joint Sphere
        const elbowGeo = new THREE.SphereGeometry(curElbowRadius, 20, 16);
        const elbowMesh = new THREE.Mesh(elbowGeo, fittingMat);
        elbowMesh.position.copy(pCurr);
        elbowMesh.castShadow = true;
        pipeGroup.add(elbowMesh);

        // Flange rings only for surface equipment lines (never underground)
        if (!isSubsurfaceBend) {
          const flangeInGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeLength, 16);
          const flangeIn = new THREE.Mesh(flangeInGeo, fittingMat);
          flangeIn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vIn);
          flangeIn.position.copy(pCurr).sub(vIn.clone().multiplyScalar(radius * 0.95));
          pipeGroup.add(flangeIn);

          const flangeOutGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeLength, 16);
          const flangeOut = new THREE.Mesh(flangeOutGeo, fittingMat);
          flangeOut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vOut);
          flangeOut.position.copy(pCurr).add(vOut.clone().multiplyScalar(radius * 0.95));
          pipeGroup.add(flangeOut);
        }
      }

      // Terminal Fittings at start and end
      if (points.length >= 2) {
        const p0 = points[0];
        const v0 = new THREE.Vector3().subVectors(points[1], p0).normalize();
        if (p0.y < -0.5) {
          // Downhole guide shoe / bullet bullnose for subterranean lines
          const noseGeo = new THREE.SphereGeometry(0.13, 16, 12);
          const noseMesh = new THREE.Mesh(noseGeo, pipeMat);
          noseMesh.position.copy(p0);
          pipeGroup.add(noseMesh);
        } else {
          const startFlange = new THREE.Mesh(
            new THREE.CylinderGeometry(flangeRadius * 1.1, flangeRadius * 1.1, flangeLength * 1.4, 16),
            fittingMat
          );
          startFlange.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v0);
          startFlange.position.copy(p0);
          pipeGroup.add(startFlange);
        }

        const pEnd = points[points.length - 1];
        const vEnd = new THREE.Vector3().subVectors(pEnd, points[points.length - 2]).normalize();
        if (pEnd.y >= -0.5) {
          const endFlange = new THREE.Mesh(
            new THREE.CylinderGeometry(flangeRadius * 1.1, flangeRadius * 1.1, flangeLength * 1.4, 16),
            fittingMat
          );
          endFlange.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vEnd);
          endFlange.position.copy(pEnd);
          pipeGroup.add(endFlange);
        }
      }

      // 2. Build Cylinders for each straight pipe segment
      const groundY = options?.groundY ?? 0;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const d = new THREE.Vector3().subVectors(p2, p1);
        const len = d.length();
        if (len < 0.05) continue;

        const dir = d.clone().normalize();
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

        // Subsurface lines use slim 0.13 radius (unsegmented slotted liner / injection tubing)
        const isSubsurfaceSpan = p1.y < -0.5 && p2.y < -0.5;
        const curRadius = isSubsurfaceSpan ? 0.13 : radius;

        // Straight pipe cylinder
        const cylGeo = new THREE.CylinderGeometry(curRadius, curRadius, len, 24);
        const cylMesh = new THREE.Mesh(cylGeo, pipeMat);
        cylMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        cylMesh.position.copy(mid);
        cylMesh.castShadow = true;
        cylMesh.receiveShadow = true;
        pipeGroup.add(cylMesh);

        // Intermediate Flanges only on long surface spans (NEVER downhole)
        if (!isSubsurfaceSpan && options?.addIntermediateFlanges && len > 5.0) {
          const numFlanges = Math.floor(len / 4.0);
          for (let f = 1; f <= numFlanges; f++) {
            const t = f / (numFlanges + 1);
            const fPos = new THREE.Vector3().lerpVectors(p1, p2, t);
            const fMesh = new THREE.Mesh(
              new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeLength, 16),
              fittingMat
            );
            fMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            fMesh.position.copy(fPos);
            pipeGroup.add(fMesh);
          }
        }

        // Pipe stanchion supports for elevated horizontal surface pipe runs
        if (
          !isSubsurfaceSpan &&
          options?.addGroundSupports &&
          Math.abs(dir.y) < 0.05 &&
          p1.y > groundY + 0.6 &&
          len >= 3.5
        ) {
          const numSupports = Math.max(1, Math.floor(len / 5.5));
          for (let s = 1; s <= numSupports; s++) {
            const st = s / (numSupports + 1);
            const sPos = new THREE.Vector3().lerpVectors(p1, p2, st);
            const supportHeight = sPos.y - groundY;
            if (supportHeight > 0.3) {
              const supportGroup = new THREE.Group();
              supportGroup.position.set(sPos.x, groundY + supportHeight / 2, sPos.z);

              // Vertical steel pipe post
              const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, supportHeight, 10),
                matDarkHull
              );
              supportGroup.add(post);

              // Pipe saddle cradle at top
              const cradle = new THREE.Mesh(
                new THREE.BoxGeometry(radius * 2.8, 0.08, radius * 2.8),
                fittingMat
              );
              cradle.position.y = supportHeight / 2;
              supportGroup.add(cradle);

              // Concrete footer block
              const footer = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.15, 0.5),
                matConcrete
              );
              footer.position.y = -supportHeight / 2 + 0.075;
              supportGroup.add(footer);

              pipeGroup.add(supportGroup);
            }
          }
        }
      }

      scene.add(pipeGroup);
      return pipeGroup;
    };

    // Pipe Rack Gantry Frames (Cradling Elevated Steam Pipes at Y = 2.8)
    const gantryX = [-20, -14, -8, -4];
    gantryX.forEach((gx) => {
      const g = new THREE.Group();
      g.position.set(gx, 0, -5);
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.9, 0.2), matDarkHull);
      postL.position.set(0, 1.45, -4.8);
      g.add(postL);
      const postR = postL.clone();
      postR.position.set(0, 1.45, 4.8);
      g.add(postR);
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 10.0), matDarkHull);
      crossBeam.position.set(0, 2.65, 0);
      g.add(crossBeam);
      scene.add(g);
    });

    // Orthogonal Waypoints for High-Pressure Steam Networks
    // Steam Line 1: Boiler SG-01 -> SP-01 -> Wellhead IW-01 -> Downhole Casing -> Reservoir Injection
    const steamWaypoints1: THREE.Vector3[] = [
      new THREE.Vector3(-22.8, 5.2, -5.0),  // SG-01 Boiler Steam Dome Discharge Flange
      new THREE.Vector3(-22.8, 2.8, -5.0),  // Vertical Riser drops to Elevated Pipe Rack (Y = 2.8)
      new THREE.Vector3(-16.0, 2.8, -5.0),  // Main Steam Trunk runs East to Splitter Manifold
      new THREE.Vector3(-16.0, 2.8, -9.0),  // 90° Turn North to Upper Branch (SP-01)
      new THREE.Vector3(-3.0, 2.8, -9.0),   // Straight run East into Wellhead IW-01 Flow Tee
      new THREE.Vector3(-3.0, 0.0, -9.0),   // Enters Wellhead Cellar Floor
      new THREE.Vector3(-3.0, -5.5, -9.0),  // Vertical Downhole Casing straight down to injection depth (Y = -5.5)
      new THREE.Vector3(-3.0, -5.5, -5.0),  // 90° Turn South into reservoir injection corridor
      new THREE.Vector3(1.5, -5.5, -5.0),   // Horizontal perforated injection lateral across payzone
    ];

    // Steam Line 2: Boiler SG-01 -> SP-02 -> Wellhead IW-02 -> Downhole Casing -> Reservoir Injection
    const steamWaypoints2: THREE.Vector3[] = [
      new THREE.Vector3(-22.8, 5.2, -5.0),  // SG-01 Boiler Steam Dome Discharge Flange
      new THREE.Vector3(-22.8, 2.8, -5.0),  // Vertical Riser drops to Elevated Pipe Rack (Y = 2.8)
      new THREE.Vector3(-16.0, 2.8, -5.0),  // Main Steam Trunk runs East to Splitter Manifold
      new THREE.Vector3(-16.0, 2.8, -1.0),  // 90° Turn South to Lower Branch (SP-02)
      new THREE.Vector3(-3.0, 2.8, -1.0),   // Straight run East into Wellhead IW-02 Flow Tee
      new THREE.Vector3(-3.0, 0.0, -1.0),   // Enters Wellhead Cellar Floor
      new THREE.Vector3(-3.0, -5.5, -1.0),  // Vertical Downhole Casing straight down to injection depth (Y = -5.5)
      new THREE.Vector3(-3.0, -5.5, -5.0),  // 90° Turn North to join reservoir injection corridor
      new THREE.Vector3(1.5, -5.5, -5.0),   // Horizontal perforated injection lateral
    ];

    // Build Continuous Physical Steam Pipelines
    // 1. Steam Line 1 & Main Boiler Trunk
    buildContinuousIndustrialPipeline(steamWaypoints1, 0.22, matPipeCyan, matPipeFitting, {
      addIntermediateFlanges: true,
      addGroundSupports: true,
      groundY: 0,
    });

    // 2. Steam Line 2 Branch (from splitter at index 2 onward to avoid duplicating boiler trunk)
    buildContinuousIndustrialPipeline(steamWaypoints2.slice(2), 0.22, matPipeSP02, matPipeFitting, {
      addIntermediateFlanges: true,
      addGroundSupports: true,
      groundY: 0,
    });

    // Helper: Build Pipeline In-Line Valve Station and Analog Pressure Gauge
    const createSteamLineStation = (tag: string, z: number, color: string) => {
      const lineGroup = new THREE.Group();
      lineGroup.position.set(-9, 2.8, z);

      // Flanged Valve Station Body
      const valveBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.6, 16), matDarkHull);
      valveBody.rotation.z = Math.PI / 2;
      lineGroup.add(valveBody);

      // Handwheel
      const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 20), matValveRed);
      handwheel.rotation.x = Math.PI / 2;
      handwheel.position.set(0, 0.55, 0);
      lineGroup.add(handwheel);

      // Analog Pressure Dial Gauge
      const gaugeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), matChrome);
      gaugeStem.position.set(1.6, 0.45, 0);
      lineGroup.add(gaugeStem);

      const gaugeDial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.1, 20),
        new THREE.MeshStandardMaterial({ color: '#0F172A', emissive: color, emissiveIntensity: 0.5 })
      );
      gaugeDial.rotation.x = Math.PI / 2;
      gaugeDial.position.set(1.6, 0.8, 0);
      lineGroup.add(gaugeDial);

      // Warning Ring if SP-02 Anomaly
      if (tag === 'SP-02' && sp02Warning) {
        const warnRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.45, 0.08, 8, 24),
          new THREE.MeshBasicMaterial({ color: '#FF0055' })
        );
        warnRing.rotation.y = Math.PI / 2;
        warnRing.position.set(-1.0, 0, 0);
        lineGroup.add(warnRing);
      }

      lineGroup.userData = { tag, name: `High-Pressure Steam Line ${tag}` };
      scene.add(lineGroup);
      interactables[tag] = lineGroup;
      return lineGroup;
    };

    createSteamLineStation('SP-01', -9, '#38BDF8');
    pinsData.push({
      tag: 'SP-01',
      title: 'SP-01',
      subtitle: '86.1 bar • 273°C',
      getMetric: () => `${liveState?.assets['SP-01']?.telemetry?.outletPressure?.toFixed(1) || '86.1'} bar`,
      getStatus: () => liveState?.assets['SP-01']?.status || 'NORMAL',
      color: '#38BDF8',
      worldPos: new THREE.Vector3(-9, 4.4, -9)
    });

    createSteamLineStation('SP-02', -1, sp02Warning ? '#F43F5E' : '#38BDF8');
    pinsData.push({
      tag: 'SP-02',
      title: 'SP-02',
      subtitle: sp02Warning ? '• ΔP HIGH WARNING' : '85.7 bar • Nominal',
      getMetric: () => `${liveState?.assets['SP-02']?.telemetry?.outletPressure?.toFixed(1) || '85.7'} bar`,
      getStatus: () => sp02Warning ? 'WARNING' : 'NORMAL',
      color: sp02Warning ? '#F43F5E' : '#38BDF8',
      worldPos: new THREE.Vector3(-9, 4.4, -1)
    });

    // =========================================================================
    // 10. ASSET: IW-01 & IW-02 STEAM INJECTION WELLHEADS
    // In-Line with SP-01 (Z = -9) and SP-02 (Z = -1) at X = -3
    // Connects horizontally from pipe rack and plunges downhole into reservoir!
    // =========================================================================
    const createInjectionWellhead = (tag: string, x: number, z: number, subLabel: string) => {
      const wellGroup = new THREE.Group();
      wellGroup.position.set(x, 0, z);
      addEquipmentPad(x, z, 3.2, 3.2, 0.4);

      // Casing Spool & Master Valves
      const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.7, 20), matDarkHull);
      spool.position.y = 0.35;
      wellGroup.add(spool);

      const masterValve1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), matDarkHull);
      masterValve1.position.y = 1.1;
      wellGroup.add(masterValve1);

      const masterValve2 = masterValve1.clone();
      masterValve2.position.y = 1.9;
      wellGroup.add(masterValve2);

      // Flow Tee (Aligned with Horizontal Steam Pipe at Y = 2.8)
      const tee = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.2, 16), matPipeCyan);
      tee.position.y = 2.8;
      wellGroup.add(tee);

      // Wing Valve & Handwheel
      const wingArm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), matPipeCyan);
      wingArm.rotation.z = Math.PI / 2;
      wingArm.position.set(0.5, 2.8, 0);
      wellGroup.add(wingArm);

      const wingWheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), matValveRed);
      wingWheel.rotation.y = Math.PI / 2;
      wingWheel.position.set(0.9, 2.8, 0);
      wellGroup.add(wingWheel);

      // Top Swab Cap with Pressure Gauge
      const topGauge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: '#0F172A', emissive: '#06B6D4', emissiveIntensity: 0.6 })
      );
      topGauge.rotation.x = Math.PI / 2;
      topGauge.position.set(0, 3.7, 0);
      wellGroup.add(topGauge);

      // Surface Conductor Casing Sleeve into ground
      const conductor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 4.0, 16),
        matDarkHull
      );
      conductor.position.y = -2.0;
      wellGroup.add(conductor);

      wellGroup.userData = { tag, name: `CSS Injection Wellhead ${tag}` };
      scene.add(wellGroup);
      interactables[tag] = wellGroup;
      return wellGroup;
    };

    createInjectionWellhead('IW-01', -3, -9, 'CSS Injection (C-4)');
    pinsData.push({
      tag: 'IW-01',
      title: 'IW-01',
      subtitle: 'CSS Injection (C-4)',
      getMetric: () => `${liveState?.assets['IW-01']?.telemetry?.wellheadPressure?.toFixed(1) || '80.0'} bar`,
      getStatus: () => liveState?.assets['IW-01']?.status || 'NORMAL',
      color: '#06B6D4',
      worldPos: new THREE.Vector3(-3, 4.4, -9)
    });

    createInjectionWellhead('IW-02', -3, -1, 'CSS Injection (C-3)');
    pinsData.push({
      tag: 'IW-02',
      title: 'IW-02',
      subtitle: 'CSS Injection (C-3)',
      getMetric: () => `${liveState?.assets['IW-02']?.telemetry?.wellheadPressure?.toFixed(1) || '79.4'} bar`,
      getStatus: () => liveState?.assets['IW-02']?.status || 'NORMAL',
      color: '#38BDF8',
      worldPos: new THREE.Vector3(-3, 4.4, -1)
    });

    // =========================================================================
    // =========================================================================
    // =========================================================================
    // 11. ASSET: RESERVOIR R-01 & GEOLOGICAL STRATIGRAPHY BLOCK (FULL VOLUME CUTAWAY)
    // Located at Center Subsurface: X = 3, Z = -5, Depth Y = 0 to -10.5
    // Spanning the entire 12m x 10.5m x 12m subterranean geological volume!
    // =========================================================================
    const resGroup = new THREE.Group();
    resGroup.position.set(3, 0, -5);

    const boxW = 12.0;
    const boxD = 12.0;
    const boxH = 10.5;

    // -------------------------------------------------------------------------
    // A. 3D GEOLOGICAL CUTAWAY WALLS (Back, Left, Right & Floor Formation Strata)
    // -------------------------------------------------------------------------
    // Geological Formations Specification:
    // 1. Overburden Siltstone: Y = 0 to -1.8 (h = 1.8)
    // 2. Clearwater Impermeable Marine Shale Seal: Y = -1.8 to -3.8 (h = 2.0)
    // 3. McMurray Heavy Bitumen Oil Sand Payzone: Y = -3.8 to -8.8 (h = 5.0)
    // 4. Devonian Limestone Bedrock: Y = -8.8 to -10.5 (h = 1.7)
    const strataConfig = [
      { yMid: -0.9, h: 1.8, color: '#0B1522', label: 'OVERBURDEN SILTSTONE (TVD 0-180m)' },
      { yMid: -2.8, h: 2.0, color: isUnsafe ? '#3B0D14' : '#0D2034', label: 'CLEARWATER IMPERMEABLE SHALE SEAL (94 BAR)' },
      { yMid: -6.3, h: 5.0, color: '#14110A', label: 'MCMURRAY FORMATION • HEAVY BITUMEN PAYZONE' },
      { yMid: -9.65, h: 1.7, color: '#070D14', label: 'DEVONIAN CARBONATE BEDROCK BASEMENT' },
    ];

    // Helper: Add Stratified Strips to a Wall Plane
    const buildStratifiedWall = (width: number, isSideWall: boolean, sideSign: number) => {
      const wallGroup = new THREE.Group();
      strataConfig.forEach((stratum) => {
        const mat = new THREE.MeshStandardMaterial({
          color: stratum.color,
          roughness: 0.92,
          metalness: 0.08,
        });
        const geo = new THREE.PlaneGeometry(width, stratum.h - 0.04);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = stratum.yMid;

        if (isSideWall) {
          mesh.rotation.y = sideSign * Math.PI / 2;
          mesh.position.x = sideSign * (boxW / 2);
        } else {
          // Back Wall
          mesh.position.z = -boxD / 2;
        }
        wallGroup.add(mesh);

        // Sedimentary Bedding Line between strata
        const lineGeo = new THREE.PlaneGeometry(width, 0.06);
        const lineMat = new THREE.MeshBasicMaterial({ color: isUnsafe ? '#7F1D1D' : '#1E293B' });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.y = stratum.yMid - stratum.h / 2;
        if (isSideWall) {
          line.rotation.y = sideSign * Math.PI / 2;
          line.position.x = sideSign * (boxW / 2 + 0.01);
        } else {
          line.position.z = -boxD / 2 + 0.01;
        }
        wallGroup.add(line);
      });
      return wallGroup;
    };

    // 1. Back Wall (Z = -boxD/2)
    resGroup.add(buildStratifiedWall(boxW, false, 0));
    // 2. Left Wall (X = -boxW/2)
    resGroup.add(buildStratifiedWall(boxD, true, -1));
    // 3. Right Wall (X = +boxW/2)
    resGroup.add(buildStratifiedWall(boxD, true, 1));

    // 4. Devonian Bedrock Floor (Y = -10.5)
    const floorBedrock = new THREE.Mesh(
      new THREE.PlaneGeometry(boxW, boxD),
      new THREE.MeshStandardMaterial({ color: '#050A10', roughness: 0.95, metalness: 0.05 })
    );
    floorBedrock.rotation.x = -Math.PI / 2;
    floorBedrock.position.set(0, -boxH, 0);
    resGroup.add(floorBedrock);

    // Floor Technical Grid
    const floorGrid = new THREE.GridHelper(boxW, 8, '#0369A1', '#0F172A');
    floorGrid.position.set(0, -boxH + 0.02, 0);
    resGroup.add(floorGrid);

    // -------------------------------------------------------------------------
    // B. IMPERMEABLE CAPROCK SEAL & GEOMECHANICAL INTEGRITY PLANE (Y = -3.8)
    // -------------------------------------------------------------------------
    // Horizontal Blueprint Integrity Plane at Y = -3.8
    const caprockCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(boxW, boxD),
      new THREE.MeshBasicMaterial({
        color: isUnsafe ? '#EF4444' : '#00F0FF',
        wireframe: true,
        transparent: true,
        opacity: isUnsafe ? 0.85 : 0.28,
      })
    );
    caprockCeiling.rotation.x = -Math.PI / 2;
    caprockCeiling.position.y = -3.8;
    resGroup.add(caprockCeiling);

    // Subtle Semi-Transparent Caprock Volume Tint (Y = 0 to -3.8)
    const caprockVolume = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, 3.8, boxD),
      new THREE.MeshStandardMaterial({
        color: isUnsafe ? '#450A0A' : '#0B1C2E',
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      })
    );
    caprockVolume.position.y = -1.9;
    resGroup.add(caprockVolume);

    // -------------------------------------------------------------------------
    // C. FRONT CUTAWAY ARCHITECTURAL FRAME & DEPTH HUD (Z = +boxD/2)
    // -------------------------------------------------------------------------
    // Precision Edges Frame around the entire 12m x 10.5m x 12m block
    const boxFrameGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
    const boxEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxFrameGeo),
      new THREE.LineBasicMaterial({
        color: isUnsafe ? '#EF4444' : '#0284C7',
        transparent: true,
        opacity: 0.45,
      })
    );
    boxEdges.position.y = -boxH / 2;
    resGroup.add(boxEdges);

    // Front-Left Depth Scale Ticks & Technical Indicators
    const depthLevels = [
      { y: 0.0, label: '0m TVD (Surface Pad)' },
      { y: -1.8, label: '-180m Overburden Base' },
      { y: -3.8, label: '-380m Caprock Shale (94 Bar)' },
      { y: -5.5, label: '-550m Steam Injection Lateral (273°C)' },
      { y: -8.5, label: '-850m Bitumen Production Sump (18 cP)' },
      { y: -10.5, label: '-1050m Devonian Bedrock' },
    ];
    depthLevels.forEach((d) => {
      // Horizontal tick marker
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.06, 0.06),
        new THREE.MeshBasicMaterial({ color: isUnsafe && d.y === -3.8 ? '#EF4444' : '#38BDF8' })
      );
      tick.position.set(-boxW / 2 + 0.45, d.y, boxD / 2);
      resGroup.add(tick);
    });

    // -------------------------------------------------------------------------
    // D. RESERVOIR ARCHITECTURAL FRAME & CONTINUOUS PAYZONE INTEGRITY
    // -------------------------------------------------------------------------
    // Unified Top Header Bar (Continuous, Completely Unsegmented)
    const resHeader = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, 0.28, 0.14),
      new THREE.MeshStandardMaterial({
        color: '#0F172A',
        metalness: 0.85,
        roughness: 0.25,
        emissive: isUnsafe ? '#DC2626' : '#0284C7',
        emissiveIntensity: 0.5,
      })
    );
    resHeader.position.set(0, 0.14, boxD / 2);
    resGroup.add(resHeader);

    // -------------------------------------------------------------------------
    // E. PRESENCE OF CRUDE OIL: ENTIRE TANK FILLED WITH HEAVY CRUDE OIL
    // -------------------------------------------------------------------------
    // 1. Bitumen Payzone Formation Matrix (Saturated Hydrocarbon Sandstone Volume)
    const payzoneGeo = new THREE.BoxGeometry(boxW - 0.05, 4.9, boxD - 0.05);
    const payzoneMat = new THREE.MeshStandardMaterial({
      color: '#0a0502',
      roughness: 0.22,
      metalness: 0.75,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const payzoneMesh = new THREE.Mesh(payzoneGeo, payzoneMat);
    payzoneMesh.position.set(0, -6.3, 0);
    resGroup.add(payzoneMesh);

    // 2. Viscous Heavy Crude Oil Liquid Surface (Undulating Living Hydrocarbon Pool at Y = -7.0)
    // Ultra-glossy obsidian liquid with petroleum thin-film iridescence sheen
    const oilLiquidGeo = new THREE.PlaneGeometry(11.55, 11.55, 64, 64);
    const oilIriTex = textures.oilIridescenceTex.clone();
    oilIriTex.needsUpdate = true;
    kinematicRefs.current.oilIridescenceTex = oilIriTex;

    const matLiquidOil = new THREE.MeshStandardMaterial({
      map: oilIriTex,
      color: '#040201',        // Obsidian petroleum black
      emissive: '#1A0B03',     // Subsurface warm thermal amber glow
      emissiveIntensity: 0.30,
      roughness: 0.04,         // Mirror-smooth wet liquid reflection
      metalness: 0.92,         // Rich hydrocarbon specular sheen
      transparent: true,
      opacity: 0.98,
    });
    const oilLiquidMesh = new THREE.Mesh(oilLiquidGeo, matLiquidOil);
    oilLiquidMesh.rotation.x = -Math.PI / 2;
    oilLiquidMesh.position.set(0, -7.0, 0); // Liquid oil surface at Y = -7.0
    oilLiquidMesh.receiveShadow = true;
    resGroup.add(oilLiquidMesh);
    kinematicRefs.current.oilLiquidMesh = oilLiquidMesh;

    // Wet Glass Tank Meniscus Rim (Fluid contact highlight at Y = -6.98)
    const meniscusRim = new THREE.Mesh(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(11.54, 0.04, 11.54)),
      new THREE.LineBasicMaterial({ color: '#D97706', transparent: true, opacity: 0.35 })
    );
    meniscusRim.position.set(0, -6.98, 0);
    resGroup.add(meniscusRim);

    // 3. Stratified Geological Payzone Sump (3-Tier Density & Thermal Gradient from Bedrock Y = -10.5 up to Y = -7.0)
    // Tier 1: Mobilized Liquefaction Zone (Y = -7.0 to -7.9) - Warm molten bronze/mahogany
    const layer1 = new THREE.Mesh(
      new THREE.BoxGeometry(11.54, 0.9, 11.54),
      new THREE.MeshStandardMaterial({
        color: '#160803',
        roughness: 0.12,
        metalness: 0.88,
        emissive: '#260E04',
        emissiveIntensity: 0.22,
        transparent: true,
        opacity: 0.92,
      })
    );
    layer1.position.set(0, -7.45, 0);
    resGroup.add(layer1);

    // Tier 2: Saturated Bituminous Sandstone Matrix (Y = -7.9 to -9.6) - McMurray oil sand
    const layer2 = new THREE.Mesh(
      new THREE.BoxGeometry(11.54, 1.7, 11.54),
      new THREE.MeshStandardMaterial({
        color: '#0A0502',
        roughness: 0.28,
        metalness: 0.70,
      })
    );
    layer2.position.set(0, -8.75, 0);
    resGroup.add(layer2);

    // Subtle horizontal sedimentary bedding lines
    const beddingLines = new THREE.Group();
    [-8.2, -8.8, -9.3].forEach((yPos) => {
      const bLine = new THREE.Mesh(
        new THREE.PlaneGeometry(11.52, 0.03),
        new THREE.MeshBasicMaterial({ color: '#3B1F0B', transparent: true, opacity: 0.45 })
      );
      bLine.position.set(0, yPos, 5.76);
      beddingLines.add(bLine);
    });
    resGroup.add(beddingLines);

    // Tier 3: Basal Bedrock Compacted Bitumen (Y = -9.6 to -10.5) - Dense pitch-black formation
    const layer3 = new THREE.Mesh(
      new THREE.BoxGeometry(11.54, 0.9, 11.54),
      new THREE.MeshStandardMaterial({
        color: '#030101',
        roughness: 0.55,
        metalness: 0.42,
      })
    );
    layer3.position.set(0, -10.05, 0);
    resGroup.add(layer3);

    // 4. Viscous Fluid Petroleum Eddies & Slicks (Organic fluid swirls replacing artificial plastic spheres)
    const eddyList: { mesh: THREE.Mesh; baseScale: number; speed: number; rotSpeed: number; centerX: number; centerZ: number; angle: number }[] = [];
    const eddyConfigs = [
      { cx: -3.8, cz: -2.2, r: 1.1, sp: 0.6, rot: 0.25 },
      { cx: -2.5, cz: 2.1, r: 0.9, sp: -0.7, rot: -0.32 },
      { cx: -1.2, cz: -1.8, r: 1.3, sp: 0.5, rot: 0.20 },
      { cx: -0.2, cz: 2.4, r: 1.0, sp: -0.8, rot: -0.28 },
      { cx: 0.8, cz: -2.5, r: 1.2, sp: 0.65, rot: 0.35 },
      { cx: 1.8, cz: 1.6, r: 1.4, sp: -0.55, rot: -0.22 },
      { cx: 2.8, cz: -1.5, r: 1.1, sp: 0.75, rot: 0.30 },
      { cx: 3.6, cz: 2.2, r: 0.95, sp: -0.6, rot: -0.26 },
      { cx: 4.4, cz: -1.0, r: 0.85, sp: 0.8, rot: 0.40 },
      { cx: -3.2, cz: 0.2, r: 1.05, sp: -0.5, rot: -0.18 },
      { cx: 0.2, cz: -0.4, r: 1.35, sp: 0.7, rot: 0.22 },
      { cx: 2.5, cz: -0.1, r: 1.25, sp: -0.65, rot: -0.30 },
    ];

    eddyConfigs.forEach((cfg) => {
      const eGeo = new THREE.PlaneGeometry(cfg.r * 2, cfg.r * 2);
      eGeo.rotateX(-Math.PI / 2);
      const eMat = new THREE.MeshBasicMaterial({
        map: textures.oilEddyTex,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const eMesh = new THREE.Mesh(eGeo, eMat);
      eMesh.position.set(cfg.cx, -6.98, cfg.cz);
      resGroup.add(eMesh);
      eddyList.push({
        mesh: eMesh,
        baseScale: 1.0,
        speed: cfg.sp,
        rotSpeed: cfg.rot,
        centerX: cfg.cx,
        centerZ: cfg.cz,
        angle: Math.random() * Math.PI * 2,
      });
    });
    kinematicRefs.current.oilViscousEddies = eddyList;

    // 5. Subsurface Oil Migration Extraction Currents (Slowly drawn toward suction bellmouth X = 5.75, Y = -7.6)
    const migCount = 100;
    const migGeo = new THREE.BufferGeometry();
    const migPos = new Float32Array(migCount * 3);
    const migColors = new Float32Array(migCount * 3);
    const migX = new Float32Array(migCount);
    const migY = new Float32Array(migCount);
    const migZ = new Float32Array(migCount);
    const migSpeed = new Float32Array(migCount);

    for (let i = 0; i < migCount; i++) {
      migX[i] = -4.5 + Math.random() * 9.5;
      migY[i] = -7.2 - Math.random() * 1.0;
      migZ[i] = (Math.random() - 0.5) * 8.0;
      migSpeed[i] = 0.25 + Math.random() * 0.35;

      migPos[i * 3] = migX[i];
      migPos[i * 3 + 1] = migY[i];
      migPos[i * 3 + 2] = migZ[i];

      // Warm amber-gold luminescent fluid tracers
      migColors[i * 3] = 0.95;
      migColors[i * 3 + 1] = 0.65 + Math.random() * 0.2;
      migColors[i * 3 + 2] = 0.15;
    }

    migGeo.setAttribute('position', new THREE.BufferAttribute(migPos, 3));
    migGeo.setAttribute('color', new THREE.BufferAttribute(migColors, 3));

    const migPoints = new THREE.Points(
      migGeo,
      new THREE.PointsMaterial({
        map: textures.glowDotTex,
        size: 0.65,
        vertexColors: true,
        transparent: true,
        opacity: 0.60,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    resGroup.add(migPoints);
    kinematicRefs.current.oilMigrationPoints = migPoints;
    kinematicRefs.current.oilMigrationData = { x: migX, y: migY, z: migZ, speed: migSpeed };

    // Subsurface Warm Ambient Illumination
    const resLight = new THREE.PointLight(isUnsafe ? '#EF4444' : '#F59E0B', 5.0, 22);
    resLight.position.set(0, -6.5, 1.0);
    resGroup.add(resLight);
    kinematicRefs.current.reservoirLight = resLight;

    // 5. Suction Bellmouth Intake Submerged in Crude Oil (Right Wall X = 5.75, Y = -7.6)
    const bellmouth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.14, 0.35, 24),
      matDarkHull
    );
    bellmouth.rotation.z = Math.PI / 2;
    bellmouth.position.set(5.75, -7.6, 0);
    resGroup.add(bellmouth);

    // Suction Vortex Ring submerged inside crude oil
    const intakeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.03, 8, 24),
      new THREE.MeshStandardMaterial({ color: '#D97706', emissive: '#B45309', emissiveIntensity: 0.8 })
    );
    intakeRing.rotation.y = Math.PI / 2;
    intakeRing.position.set(5.70, -7.6, 0);
    resGroup.add(intakeRing);

    // -------------------------------------------------------------------------
    // F. VOLUMETRIC EXPANDING STEAM CHEST & THERMAL MELTING FRONT
    // -------------------------------------------------------------------------
    // 1. Industrial High-Pressure Steam Injection Diffuser Nozzle (Terminates at X = -1.5)
    // Angled downward at -21.8 deg into the crude oil reservoir
    const diffuserNozzle = new THREE.Group();
    diffuserNozzle.position.set(-1.5, -5.5, 0);
    diffuserNozzle.rotation.z = -0.38; // ~ -21.8 deg down towards the oil pool

    // Outer stainless steel casing
    const nozzleCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.14, 0.32, 24),
      new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.95, roughness: 0.15 })
    );
    nozzleCone.rotation.z = -Math.PI / 2;
    diffuserNozzle.add(nozzleCone);

    // Superheated venturi choke glowing ring
    const nozzleGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.035, 16, 24),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    );
    nozzleGlow.rotation.y = Math.PI / 2;
    nozzleGlow.position.x = 0.15;
    diffuserNozzle.add(nozzleGlow);

    // Heavy bolted flange collar
    const nozzleCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.07, 24),
      new THREE.MeshStandardMaterial({ color: '#94A3B8', metalness: 0.9, roughness: 0.2 })
    );
    nozzleCollar.rotation.z = Math.PI / 2;
    nozzleCollar.position.x = -0.14;
    diffuserNozzle.add(nozzleCollar);

    resGroup.add(diffuserNozzle);

    // High-intensity local steam injection point light casting radiant glow onto vapor & oil
    const steamInjLight = new THREE.PointLight('#BAE6FD', 3.2, 9.5);
    steamInjLight.position.set(-1.25, -5.6, 0);
    resGroup.add(steamInjLight);
    kinematicRefs.current.steamInjectionLight = steamInjLight;

    // 2. Soft Incandescent Steam Discharge Nozzle Flare (Seamless nozzle blend, no harsh geometry)
    const flareGeo = new THREE.CylinderGeometry(0.32, 0.14, 0.75, 24, 1, true);
    const flareDir = new THREE.Vector3(2.0 - (-1.35), -7.0 - (-5.56), 0).normalize();
    const flareQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), flareDir);
    const flareMat = new THREE.MeshBasicMaterial({
      map: textures.steamVaporTex,
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const flareMesh = new THREE.Mesh(flareGeo, flareMat);
    flareMesh.quaternion.copy(flareQuat);
    flareMesh.position.set(-1.0, -5.72, 0);
    resGroup.add(flareMesh);
    kinematicRefs.current.steamChestCore = flareMesh;

    // 3. Low-Lying Atmospheric Vapor Blanket (Hugging the crude oil surface strictly inside the tank)
    // Spans X: -0.2 to 3.8, Z: -2.0 to +2.0 at Y = -6.86
    const blanketGeo = new THREE.PlaneGeometry(4.0, 3.6, 24, 24);
    blanketGeo.rotateX(-Math.PI / 2);
    const blanketMat = new THREE.MeshBasicMaterial({
      map: textures.steamVaporTex,
      color: '#BAE6FD',
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const blanketMesh = new THREE.Mesh(blanketGeo, blanketMat);
    blanketMesh.position.set(1.8, -6.86, 0);
    resGroup.add(blanketMesh);
    kinematicRefs.current.steamBlanket = blanketMesh;

    // Save baseline Y positions for fluid wave undulation
    const blanketPosArr = blanketGeo.attributes.position.array as Float32Array;
    const blanketBaseY = new Float32Array(blanketPosArr.length / 3);
    for (let i = 0; i < blanketBaseY.length; i++) {
      blanketBaseY[i] = blanketPosArr[i * 3 + 1];
    }
    kinematicRefs.current.steamBlanketBaseY = blanketBaseY;

    // 4. Radiant Thermal Melting & Liquefaction Zone on Crude Oil Surface
    // Centered at X = 1.6, Z = 0 directly on the crude oil surface (Y = -6.97)
    const meltDiscGeo = new THREE.PlaneGeometry(3.6, 2.8);
    meltDiscGeo.rotateX(-Math.PI / 2);
    const meltDiscMat = new THREE.MeshBasicMaterial({
      map: textures.thermalMeltGlowTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const meltDisc = new THREE.Mesh(meltDiscGeo, meltDiscMat);
    meltDisc.position.set(1.6, -6.97, 0);
    resGroup.add(meltDisc);
    kinematicRefs.current.thermalMeltZone = meltDisc;

    // Concentric Thermal Heat Dissipation Wavefronts (Radiating across oil)
    const heatWavesList: { mesh: THREE.Mesh; phase: number; baseScale: number }[] = [];
    const wavePhases = [0.0, 0.33, 0.66];
    wavePhases.forEach((ph) => {
      const wGeo = new THREE.RingGeometry(0.3, 0.55, 36);
      wGeo.rotateX(-Math.PI / 2);
      const wMat = new THREE.MeshBasicMaterial({
        map: textures.thermalWaveRingTex,
        color: '#F59E0B',
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.set(1.6, -6.96, 0);
      resGroup.add(wMesh);
      heatWavesList.push({ mesh: wMesh, phase: ph, baseScale: 1.0 });
    });
    kinematicRefs.current.thermalHeatWaves = heatWavesList;

    // Molten Boiling Micro-Vortices / Sizzle Bubbles on Liquefaction Zone
    const boilMicroList: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; centerX: number; centerZ: number }[] = [];
    const boilOffsets = [
      { cx: 1.0, cz: -0.3, r: 0.16, sp: 2.2 },
      { cx: 1.4, cz: 0.4, r: 0.20, sp: -1.9 },
      { cx: 1.8, cz: -0.2, r: 0.22, sp: 2.5 },
      { cx: 2.2, cz: 0.3, r: 0.18, sp: -2.1 },
      { cx: 2.6, cz: -0.4, r: 0.24, sp: 1.8 },
      { cx: 3.0, cz: 0.2, r: 0.20, sp: -2.4 },
      { cx: 1.5, cz: -0.6, r: 0.14, sp: 2.7 },
      { cx: 2.3, cz: 0.7, r: 0.17, sp: -1.7 },
    ];
    boilOffsets.forEach((b) => {
      const bRing = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.14, 20),
        new THREE.MeshBasicMaterial({
          color: '#FEF08A',
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      bRing.rotation.x = -Math.PI / 2;
      bRing.position.set(b.cx, -6.96, b.cz);
      resGroup.add(bRing);
      boilMicroList.push({
        mesh: bRing,
        angle: Math.random() * Math.PI * 2,
        speed: b.sp,
        radius: b.r,
        centerX: b.cx,
        centerZ: b.cz,
      });
    });
    kinematicRefs.current.boilMicroRings = boilMicroList;

    // 5. Volumetric Dynamic Steam Mist Particle Simulation (360 Billowy Micro-Particles)
    // Strictly contained within reservoir boundaries (X <= 4.4, Y in [-6.95, -4.5], Z in [-2.5, 2.5])
    const mistCount = 360;
    const mistGeo = new THREE.BufferGeometry();
    const mistPositions = new Float32Array(mistCount * 3);
    const mistColors = new Float32Array(mistCount * 3);

    const mistX = new Float32Array(mistCount);
    const mistY = new Float32Array(mistCount);
    const mistZ = new Float32Array(mistCount);
    const mistVx = new Float32Array(mistCount);
    const mistVy = new Float32Array(mistCount);
    const mistVz = new Float32Array(mistCount);
    const mistLife = new Float32Array(mistCount);
    const mistMaxLife = new Float32Array(mistCount);
    const mistBaseScale = new Float32Array(mistCount);

    for (let i = 0; i < mistCount; i++) {
      mistMaxLife[i] = 2.2 + Math.random() * 1.8;
      mistLife[i] = Math.random() * mistMaxLife[i];
      mistBaseScale[i] = 0.6 + Math.random() * 0.7;

      // Staggered initial position along the descent towards the oil
      const frac = mistLife[i] / mistMaxLife[i];
      const startX = -1.35 + frac * 4.0;
      const startY = frac < 0.4
        ? -5.56 + (frac / 0.4) * (-6.95 - (-5.56))
        : -6.92 + (frac - 0.4) * 0.8;
      const startZ = (Math.random() - 0.5) * 1.6 * (0.3 + frac);

      mistX[i] = Math.min(4.2, startX);
      mistY[i] = Math.max(-6.95, Math.min(-4.5, startY));
      mistZ[i] = startZ;

      const angleY = -0.38 + (Math.random() - 0.5) * 0.26;
      const angleZ = (Math.random() - 0.5) * 0.35;
      const speed = 1.6 + Math.random() * 1.1;
      mistVx[i] = Math.cos(angleY) * Math.cos(angleZ) * speed;
      mistVy[i] = Math.sin(angleY) * speed;
      mistVz[i] = Math.sin(angleZ) * speed;

      mistPositions[i * 3] = mistX[i];
      mistPositions[i * 3 + 1] = mistY[i];
      mistPositions[i * 3 + 2] = mistZ[i];

      // Initial fade
      const fade = Math.max(0, Math.min(1, (4.4 - mistX[i]) / 1.4));
      mistColors[i * 3] = 1.0 * fade;
      mistColors[i * 3 + 1] = 0.95 * fade;
      mistColors[i * 3 + 2] = 0.90 * fade;
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
    mistGeo.setAttribute('color', new THREE.BufferAttribute(mistColors, 3));

    const mistMat = new THREE.PointsMaterial({
      map: textures.glowDotTex,
      size: 1.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mistPoints = new THREE.Points(mistGeo, mistMat);
    resGroup.add(mistPoints);
    kinematicRefs.current.steamMistVaporPoints = mistPoints;
    kinematicRefs.current.steamMistData = {
      x: mistX,
      y: mistY,
      z: mistZ,
      vx: mistVx,
      vy: mistVy,
      vz: mistVz,
      life: mistLife,
      maxLife: mistMaxLife,
      baseScale: mistBaseScale,
    };

    // -------------------------------------------------------------------------
    // G. UNSAFE MODE: CAPROCK SHEAR FRACTURES & BREACH RING
    // -------------------------------------------------------------------------
    if (isUnsafe) {
      const crackCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.0, -5.5, 0),
        new THREE.Vector3(-0.4, -4.6, 0.4),
        new THREE.Vector3(0.2, -3.8, 0.2),
        new THREE.Vector3(0.6, -1.5, 0.8),
      ]);
      const crackTube = new THREE.Mesh(
        new THREE.TubeGeometry(crackCurve, 24, 0.18, 8, false),
        new THREE.MeshBasicMaterial({ color: '#FF0033' })
      );
      resGroup.add(crackTube);

      // Flashing Hazard Breach Ring on Caprock Ceiling (Y = -3.8)
      const breachRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.12, 8, 28),
        new THREE.MeshBasicMaterial({ color: '#FF0044', wireframe: true })
      );
      breachRing.rotation.x = Math.PI / 2;
      breachRing.position.set(0.2, -3.8, 0.2);
      resGroup.add(breachRing);
      kinematicRefs.current.caprockBreachRing = breachRing;
    }

    resGroup.userData = { tag: 'R-01', name: 'Subsurface Reservoir Matrix R-01' };
    scene.add(resGroup);
    interactables['R-01'] = resGroup;

    pinsData.push({
      tag: 'R-01',
      title: 'RESERVOIR R-01',
      subtitle: isUnsafe ? '⚠️ CAPROCK COMPROMISED (+11b)' : 'CAPROCK SHALE (94 BAR CEILING)',
      getMetric: () => `${simSummary?.predictedReservoirTemp || 183.5} °C • 18 cP`,
      getStatus: () => isUnsafe ? 'CRITICAL' : 'NORMAL',
      color: isUnsafe ? '#EF4444' : '#F59E0B',
      worldPos: new THREE.Vector3(3, 1.2, -5)
    });

    // =========================================================================
    // 12. ASSET: PW-01 PRODUCTION WELLHEAD
    // Positioned at X = 11, Z = -5 (Right of Reservoir)
    // =========================================================================
    const pwGroup = new THREE.Group();
    pwGroup.position.set(11, 0, -5);
    addEquipmentPad(11, -5, 3.2, 3.2, 0.4);

    // Surface Production Christmas Tree (Amber / Gold theme for Crude)
    const pwSpool = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.8, 20), matDarkHull);
    pwSpool.position.y = 0.4;
    pwGroup.add(pwSpool);

    const pwMaster = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), matDarkHull);
    pwMaster.position.y = 1.2;
    pwGroup.add(pwMaster);

    const pwTee = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.4, 16), matOilPipe);
    pwTee.position.y = 2.0;
    pwGroup.add(pwTee);

    // Flowline Connection Arm towards SRP-01
    const pwArm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16), matOilPipe);
    pwArm.rotation.z = Math.PI / 2;
    pwArm.position.set(0.45, 2.0, 0);
    pwGroup.add(pwArm);

    // Surface Conductor Casing Sleeve into ground
    const pwCasing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 4.0, 16),
      matDarkHull
    );
    pwCasing.position.y = -2.0;
    pwGroup.add(pwCasing);

    pwGroup.userData = { tag: 'PW-01', name: 'Production Well PW-01' };
    scene.add(pwGroup);
    interactables['PW-01'] = pwGroup;

    pinsData.push({
      tag: 'PW-01',
      title: 'PW-01',
      subtitle: 'Production Well',
      getMetric: () => `${liveState?.assets['PW-01']?.telemetry?.flowRate?.toFixed(1) || '440.67'} BPD`,
      getStatus: () => liveState?.assets['PW-01']?.status || 'NORMAL',
      color: '#F59E0B',
      worldPos: new THREE.Vector3(11, 3.8, -5)
    });

    // =========================================================================
    // 13. ASSET: SRP-01 SUCKER ROD BEAM PUMPJACK (HEAVY CLASS-C ARCHITECTURE)
    // Matches the 2D Schematic with 100% mechanical fidelity:
    // - Dark Slate / Industrial Navy Samson A-Frame Tower with Electric Cyan Trims & X-Bracing
    // - Access Safety Inspection Ladder on Samson Post
    // - Wide-Flange Metallic Gunmetal I-Beam with "PETRONEXUS HD-320" Branding
    // - Authentic Scimitar Horsehead with 3 Lightening Holes & Cyan Wireline Arc Track
    // - Dual Wireline Bridles, Carrier Bar, and Mirror-Chrome Polished Rod
    // - Heavy Ribbed Double-Reduction Gearbox & 45 kW Motor
    // - Safety Amber/Orange Counterweights & Dynamic Rigid Pitman Connecting Rods
    // =========================================================================
    const srpGroup = new THREE.Group();
    srpGroup.position.set(18, 0, -5);
    addEquipmentPad(18, -5, 11, 7, 0.5);

    // Dedicated Realistic Materials
    const matSrpPost = new THREE.MeshStandardMaterial({
      color: '#1A283D', // Industrial Dark Slate / Navy Steel
      metalness: 0.75,
      roughness: 0.28,
    });

    const matSrpPostTrim = new THREE.MeshStandardMaterial({
      color: '#0284C7', // Electric Cyan Outline / Edge Trim
      metalness: 0.6,
      roughness: 0.25,
      emissive: '#0369A1',
      emissiveIntensity: 0.4,
    });

    const matSrpBeamSteel = new THREE.MeshStandardMaterial({
      color: '#475569', // Metallic Gunmetal / Slate Steel Web (Matching 2D I-beam!)
      metalness: 0.8,
      roughness: 0.25,
    });

    const matSrpBeamFlange = new THREE.MeshStandardMaterial({
      color: '#94A3B8', // Polished Top/Bottom Flange Steel
      metalness: 0.85,
      roughness: 0.2,
    });

    const matSrpCounterweight = new THREE.MeshStandardMaterial({
      color: '#F59E0B', // Safety Golden Amber Counterweight
      metalness: 0.5,
      roughness: 0.3,
      emissive: '#D97706',
      emissiveIntensity: 0.25,
    });

    const matSrpHorsehead = new THREE.MeshStandardMaterial({
      color: '#152438', // Dark Navy Cast Steel
      metalness: 0.75,
      roughness: 0.28,
    });

    const matSrpPitman = new THREE.MeshStandardMaterial({
      color: '#475569', // Forged Steel Pitman Connecting Rod
      metalness: 0.85,
      roughness: 0.2,
    });

    // -------------------------------------------------------------------------
    // A. SAMSON POST A-FRAME TOWER (Heavy Structural Truss)
    // -------------------------------------------------------------------------
    const samsonGroup = new THREE.Group();

    // 4 Box-Column Tapered Legs (From Wide Base to Apex Saddle at Y = 6.0)
    const legCoords = [
      { bx: -1.3, bz: -1.0, tx: -0.2, tz: -0.4 },
      { bx: -1.3, bz:  1.0, tx: -0.2, tz:  0.4 },
      { bx:  1.3, bz: -1.0, tx:  0.2, tz: -0.4 },
      { bx:  1.3, bz:  1.0, tx:  0.2, tz:  0.4 },
    ];

    legCoords.forEach((c) => {
      const p1 = new THREE.Vector3(c.bx, 0.2, c.bz);
      const p2 = new THREE.Vector3(c.tx, 6.0, c.tz);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, len, 0.24), matSrpPost);
      leg.position.copy(mid);
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      leg.castShadow = true;
      samsonGroup.add(leg);

      // Base Mounting Foot Plate
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.45), matDarkHull);
      foot.position.set(c.bx, 0.15, c.bz);
      samsonGroup.add(foot);
    });

    // Horizontal Structural Cross-Struts (Lower Tier Y = 2.4, Upper Tier Y = 4.2)
    [2.4, 4.2].forEach((tierY) => {
      const factor = 1 - (tierY / 6.0);
      const spanX = 2.6 * factor + 0.4;
      const spanZ = 2.0 * factor + 0.8;

      // Left & Right Horizontal Struts
      const strutL = new THREE.Mesh(new THREE.BoxGeometry(spanX, 0.14, 0.14), matSrpPostTrim);
      strutL.position.set(0, tierY, -spanZ / 2);
      samsonGroup.add(strutL);

      const strutR = strutL.clone();
      strutR.position.set(0, tierY, spanZ / 2);
      samsonGroup.add(strutR);

      // Front & Back Horizontal Struts
      const strutF = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, spanZ), matSrpPostTrim);
      strutF.position.set(-spanX / 2, tierY, 0);
      samsonGroup.add(strutF);

      const strutB = strutF.clone();
      strutB.position.set(spanX / 2, tierY, 0);
      samsonGroup.add(strutB);
    });

    // Diagonal Cross-Lattice X-Bracing between Tiers
    const braceMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });
    const createCrossBrace = (pA: THREE.Vector3, pB: THREE.Vector3) => {
      const dir = new THREE.Vector3().subVectors(pB, pA);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 8), braceMat);
      brace.position.copy(mid);
      brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      samsonGroup.add(brace);
    };

    createCrossBrace(new THREE.Vector3(-1.1, 0.3, -1.0), new THREE.Vector3(0.9, 2.4, -0.8));
    createCrossBrace(new THREE.Vector3(1.1, 0.3, -1.0), new THREE.Vector3(-0.9, 2.4, -0.8));
    createCrossBrace(new THREE.Vector3(-1.1, 0.3, 1.0), new THREE.Vector3(0.9, 2.4, 0.8));
    createCrossBrace(new THREE.Vector3(1.1, 0.3, 1.0), new THREE.Vector3(-0.9, 2.4, 0.8));

    // Access Inspection Ladder on Samson Post Leg
    const ladderX = -1.15;
    const ladderZ = -1.05;
    const ladderRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 5.6, 8), matStackSteel);
    ladderRailL.position.set(ladderX, 2.9, ladderZ - 0.15);
    samsonGroup.add(ladderRailL);
    const ladderRailR = ladderRailL.clone();
    ladderRailR.position.set(ladderX, 2.9, ladderZ + 0.15);
    samsonGroup.add(ladderRailR);

    for (let ly = 0.6; ly <= 5.4; ly += 0.6) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), matStackSteel);
      rung.rotation.x = Math.PI / 2;
      rung.position.set(ladderX, ly, ladderZ);
      samsonGroup.add(rung);
    }

    // Center Saddle Bearing Housing at Top (Y = 6.2)
    const saddleHousing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 1.3), matDarkHull);
    saddleHousing.position.set(0, 6.2, 0);
    samsonGroup.add(saddleHousing);

    // Cyan Outline Trim around Saddle Box
    const saddleTrim = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.08, 1.34), matSrpPostTrim);
    saddleTrim.position.set(0, 6.2, 0);
    samsonGroup.add(saddleTrim);

    // Heavy Pivot Journal Hub Caps
    const pivotHubL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 20), matChrome);
    pivotHubL.rotation.x = Math.PI / 2;
    pivotHubL.position.set(0, 6.2, -0.7);
    samsonGroup.add(pivotHubL);

    const pivotHubR = pivotHubL.clone();
    pivotHubR.position.set(0, 6.2, 0.7);
    samsonGroup.add(pivotHubR);

    // Grease Lubrication Fitting
    const greaseNipple = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8), matSrpCounterweight);
    greaseNipple.position.set(0, 6.6, 0);
    samsonGroup.add(greaseNipple);

    srpGroup.add(samsonGroup);

    // -------------------------------------------------------------------------
    // B. WALKING BEAM (AUTHENTIC WIDE-FLANGE I-BEAM WITH PETRONEXUS BRANDING)
    // -------------------------------------------------------------------------
    const walkingBeam = new THREE.Group();
    walkingBeam.position.set(0, 6.2, 0);

    const beamLen = 7.4;
    const beamMidX = -0.15; // Centered around saddle pivot (Front reaches -3.8, Tail reaches +3.5)

    // Central Web Plate
    const beamWeb = new THREE.Mesh(new THREE.BoxGeometry(beamLen, 0.65, 0.1), matSrpBeamSteel);
    beamWeb.position.set(beamMidX, 0, 0);
    beamWeb.castShadow = true;
    walkingBeam.add(beamWeb);

    // Top Flange Plate
    const topFlange = new THREE.Mesh(new THREE.BoxGeometry(beamLen, 0.08, 0.48), matSrpBeamFlange);
    topFlange.position.set(beamMidX, 0.36, 0);
    topFlange.castShadow = true;
    walkingBeam.add(topFlange);

    // Bottom Flange Plate
    const botFlange = new THREE.Mesh(new THREE.BoxGeometry(beamLen, 0.08, 0.48), matSrpBeamFlange);
    botFlange.position.set(beamMidX, -0.36, 0);
    botFlange.castShadow = true;
    walkingBeam.add(botFlange);

    // Vertical Structural Web Stiffener Ribs along Beam
    [-3.0, -2.1, -1.1, 1.1, 2.1, 3.0].forEach((sx) => {
      const stiffener = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.64, 0.44), matSrpBeamFlange);
      stiffener.position.set(sx, 0, 0);
      walkingBeam.add(stiffener);
    });

    // Center Saddle Clamping Box
    const saddleClamp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.82, 0.56), matDarkHull);
    saddleClamp.position.set(0, 0, 0);
    walkingBeam.add(saddleClamp);

    // PETRONEXUS HD-320 Side Branding Plaques
    const logoMat = new THREE.MeshBasicMaterial({ map: textures.beamLogoTex });
    const logoMeshF = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.35), logoMat);
    logoMeshF.position.set(-0.8, 0, 0.06);
    walkingBeam.add(logoMeshF);

    const logoMeshB = logoMeshF.clone();
    logoMeshB.position.set(-0.8, 0, -0.06);
    logoMeshB.rotation.y = Math.PI;
    walkingBeam.add(logoMeshB);

    // Rear Tail Equalizer Bar (Holds Pitman Arm Bearings at X = +3.5)
    const tailEqualizer = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 16), matChrome);
    tailEqualizer.rotation.x = Math.PI / 2;
    tailEqualizer.position.set(3.5, 0, 0);
    walkingBeam.add(tailEqualizer);

    // Spherical Tail Bearing Housings for Pitman Arm Ends
    const tailBearingL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), matDarkHull);
    tailBearingL.position.set(3.5, 0, -1.15);
    walkingBeam.add(tailBearingL);

    const tailBearingR = tailBearingL.clone();
    tailBearingR.position.set(3.5, 0, 1.15);
    walkingBeam.add(tailBearingR);

    // -------------------------------------------------------------------------
    // C. AUTHENTIC SCIMITAR HORSEHEAD (Curved Front Arc with Lightening Holes)
    // -------------------------------------------------------------------------
    const horseheadGroup = new THREE.Group();
    horseheadGroup.position.set(-3.8, 0, 0);

    // 2D Profile Shape with authentic crescent curve and 3 circular cutouts
    const horseheadShape = new THREE.Shape();
    horseheadShape.moveTo(0, 1.4);
    // Outer front convex arc where cables roll
    horseheadShape.bezierCurveTo(-0.75, 0.9, -0.9, -0.3, 0, -1.3);
    // Lower back edge toward walking beam
    horseheadShape.lineTo(0.9, -0.7);
    // Inner concave contour back to top
    horseheadShape.bezierCurveTo(0.2, -0.2, 0.2, 0.7, 0.8, 0.9);
    horseheadShape.closePath();

    // 3 Circular Cut-Out Lightening Holes
    const hole1 = new THREE.Path();
    hole1.absarc(0.2, 0.65, 0.16, 0, Math.PI * 2, true);
    horseheadShape.holes.push(hole1);

    const hole2 = new THREE.Path();
    hole2.absarc(-0.05, 0.0, 0.22, 0, Math.PI * 2, true);
    horseheadShape.holes.push(hole2);

    const hole3 = new THREE.Path();
    hole3.absarc(0.2, -0.65, 0.18, 0, Math.PI * 2, true);
    horseheadShape.holes.push(hole3);

    const horseheadGeo = new THREE.ExtrudeGeometry(horseheadShape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    horseheadGeo.center();

    const horseheadMesh = new THREE.Mesh(horseheadGeo, matSrpHorsehead);
    horseheadMesh.castShadow = true;
    horseheadGroup.add(horseheadMesh);

    // Curved Outer Flange Wireline Track Channel (Electric Cyan Rim)
    const curvePoints: THREE.Vector3[] = [];
    for (let t = 0; t <= 20; t++) {
      const u = t / 20;
      const y = 1.4 - u * 2.7;
      const x = -0.75 * Math.sin(u * Math.PI) - 0.2 * (1 - u);
      curvePoints.push(new THREE.Vector3(x, y, 0));
    }
    const trackCurve = new THREE.CatmullRomCurve3(curvePoints);
    const trackMesh = new THREE.Mesh(
      new THREE.TubeGeometry(trackCurve, 32, 0.06, 8, false),
      matSrpPostTrim
    );
    horseheadGroup.add(trackMesh);

    // Top Bridle Anchor Thimble / Cable Clamp Pin
    const topCableAnchor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.44, 12),
      matSrpCounterweight
    );
    topCableAnchor.rotation.x = Math.PI / 2;
    topCableAnchor.position.set(0, 1.4, 0);
    horseheadGroup.add(topCableAnchor);

    walkingBeam.add(horseheadGroup);
    srpGroup.add(walkingBeam);
    kinematicRefs.current.walkingBeam = walkingBeam;

    // -------------------------------------------------------------------------
    // D. HEAVY API-11E POLISHED ROD, FORGED CARRIER BAR, CLAMP & WELLHEAD PUMPING TREE
    // -------------------------------------------------------------------------
    // 1. Dual Heavy Wireline Bridle Cables (Braided High-Tensile Steel Wire Rope)
    const cableGeo = new THREE.CylinderGeometry(0.032, 0.032, 2.0, 16);
    const matBridleRope = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      emissive: '#94A3B8',
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.18,
    });
    const bridleL = new THREE.Mesh(cableGeo, matBridleRope);
    bridleL.position.set(-4.5, 3.2, -0.22);
    srpGroup.add(bridleL);
    kinematicRefs.current.bridleL = bridleL;

    const bridleR = new THREE.Mesh(cableGeo, matBridleRope);
    bridleR.position.set(-4.5, 3.2, 0.22);
    srpGroup.add(bridleR);
    kinematicRefs.current.bridleR = bridleR;

    // 2. Heavy API Carrier Bar Assembly with API Rod Clamp & Cable Sockets
    const carrierBar = new THREE.Group();
    carrierBar.position.set(-4.5, 2.4, 0);

    // Heavy Cast-Steel Carrier Bar Beam (I-beam profile with machined chamfers)
    const barBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.72), matDarkHull);
    carrierBar.add(barBody);

    const barTrim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.74), matSrpPostTrim);
    carrierBar.add(barTrim);

    // Spherical Rod Alignment Bushing Collar in Center
    const centerBushing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: '#D97706', metalness: 0.85, roughness: 0.25 })
    );
    carrierBar.add(centerBushing);

    // Heavy API Polished Rod Clamp (Mounted directly on top of carrier bar)
    const clampGroup = new THREE.Group();
    clampGroup.position.set(0, 0.15, 0);

    // Golden Safety Amber Clamp Split Block Body
    const clampBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.18, 0.34),
      matSrpCounterweight
    );
    clampGroup.add(clampBody);

    // 4 Heavy High-Tensile Clamp Cross Bolts & Nuts
    const boltPositions = [
      { x: -0.10, y: 0.05, z: 0.13 },
      { x: 0.10, y: 0.05, z: 0.13 },
      { x: -0.10, y: -0.05, z: 0.13 },
      { x: 0.10, y: -0.05, z: 0.13 },
    ];
    boltPositions.forEach((bp) => {
      const boltStud = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.40, 8), matDarkHull);
      boltStud.rotation.x = Math.PI / 2;
      boltStud.position.set(bp.x, bp.y, 0);
      clampGroup.add(boltStud);

      // Front & Rear Hex Nuts
      const nutFront = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.04, 6), matChrome);
      nutFront.rotation.x = Math.PI / 2;
      nutFront.position.set(bp.x, bp.y, 0.19);
      clampGroup.add(nutFront);

      const nutBack = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.04, 6), matChrome);
      nutBack.rotation.x = Math.PI / 2;
      nutBack.position.set(bp.x, bp.y, -0.19);
      clampGroup.add(nutBack);
    });

    // Left and Right Wireline Cable Sockets / Thimble Cleats on Carrier Bar
    [-0.22, 0.22].forEach((zPos) => {
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), matDarkHull);
      socket.position.set(0, 0, zPos);
      carrierBar.add(socket);

      const clevisPin = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 12), matChrome);
      clevisPin.rotation.z = Math.PI / 2;
      clevisPin.position.set(0, 0, zPos);
      carrierBar.add(clevisPin);
    });

    carrierBar.add(clampGroup);
    srpGroup.add(carrierBar);
    kinematicRefs.current.carrierBar = carrierBar as any;

    // 3. Heavy Industrial Polished Rod (Pure Brilliant Silver Finish - Highly Visible)
    const matPureSilverRod = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',          // Pure radiant silver-white
      emissive: '#CBD5E1',       // High-contrast luminous silver core glow
      emissiveIntensity: 0.58,   // High visibility against dark background
      metalness: 0.55,           // Metallic luster
      roughness: 0.18,           // Soft diffuse silver sheen
    });

    const polishedRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.086, 6.0, 24),
      matPureSilverRod
    );
    polishedRod.position.set(-4.5, 2.6, 0);
    polishedRod.castShadow = true;
    srpGroup.add(polishedRod);
    kinematicRefs.current.polishedRod = polishedRod;

    // 4. Complete Wellhead Christmas Tree & High-Pressure Stuffing Box Assembly at X = -4.5
    const wellheadGroup = new THREE.Group();
    wellheadGroup.position.set(-4.5, 0, 0);

    // Concrete Plinth Anchor Flange
    const groundFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 24), matDarkHull);
    groundFlange.position.y = 0.07;
    wellheadGroup.add(groundFlange);

    // Casing Head Spool & Tubing Bowl
    const casingSpool = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.45, 20), matPipeFitting);
    casingSpool.position.y = 0.35;
    wellheadGroup.add(casingSpool);

    // Wellhead Master Gate Valve with Safety Red Wheel
    const masterValve = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.52), matDarkHull);
    masterValve.position.y = 0.70;
    wellheadGroup.add(masterValve);

    const masterWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), matValveRed);
    masterWheel.rotation.y = Math.PI / 2;
    masterWheel.position.set(0.34, 0.70, 0);
    wellheadGroup.add(masterWheel);

    // Rod Pumping Blowout Preventer (BOP) with Manual Locking Screw Handles
    const bopBody = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.58), matDarkHull);
    bopBody.position.y = 1.02;
    wellheadGroup.add(bopBody);

    [-0.34, 0.34].forEach((zOff) => {
      const bopWheel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), matSrpCounterweight);
      bopWheel.position.set(0, 1.02, zOff);
      wellheadGroup.add(bopWheel);
    });

    // Heavy 4-Way Pumping Flow Tee (Connects vertical wellbore to horizontal gathering line!)
    const flowTee = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.46, 20), matDarkHull);
    flowTee.position.y = 1.35;
    wellheadGroup.add(flowTee);

    // Flowline Side Discharge Neck & Flange (Aligned with horizontal pipe at Y = 1.35!)
    const flowNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 16), matDarkHull);
    flowNeck.rotation.z = Math.PI / 2;
    flowNeck.position.set(0.22, 1.35, 0);
    wellheadGroup.add(flowNeck);

    const flowNeckFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), matPipeFitting);
    flowNeckFlange.rotation.z = Math.PI / 2;
    flowNeckFlange.position.set(0.36, 1.35, 0);
    wellheadGroup.add(flowNeckFlange);

    // Analog Tubing Pressure Gauge (0-100 bar) on Pigtail Siphon Tube
    const siphonTube = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 16), matChrome);
    siphonTube.position.set(-0.24, 1.48, 0);
    wellheadGroup.add(siphonTube);

    const gaugeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), matChrome);
    gaugeBody.rotation.x = Math.PI / 2;
    gaugeBody.position.set(-0.24, 1.62, 0);
    wellheadGroup.add(gaugeBody);

    const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.10, 16), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
    gaugeFace.position.set(-0.24, 1.62, 0.026);
    wellheadGroup.add(gaugeFace);

    // Heavy Ribbed Stuffing Box Body with Cone Packing Housing
    const stuffingBoxBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.58, 20), matDarkHull);
    stuffingBoxBody.position.y = 1.84;
    wellheadGroup.add(stuffingBoxBody);

    // Heat-Dissipating Circumferential Cooling Fins on Stuffing Box
    for (let fy = 1.68; fy <= 2.0; fy += 0.08) {
      const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.025, 20), matPipeFitting);
      fin.position.y = fy;
      wellheadGroup.add(fin);
    }

    // Knurled Brass Packing Gland Nut with Dual Adjustment T-Handles
    const glandNut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: '#D97706', metalness: 0.88, roughness: 0.22 })
    );
    glandNut.position.y = 2.18;
    wellheadGroup.add(glandNut);

    const glandHandles = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.05, 0.05),
      new THREE.MeshStandardMaterial({ color: '#B45309', metalness: 0.9, roughness: 0.25 })
    );
    glandHandles.position.y = 2.18;
    wellheadGroup.add(glandHandles);

    // Environmental Lubricator Oil Catcher Bowl on Top
    const lubricator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.8, roughness: 0.3 })
    );
    lubricator.position.y = 2.34;
    wellheadGroup.add(lubricator);

    srpGroup.add(wellheadGroup);

    // -------------------------------------------------------------------------
    // E. DRIVE UNIT: HEAVY GEARBOX & 45 kW ELECTRIC MOTOR
    // -------------------------------------------------------------------------
    const driveGroup = new THREE.Group();
    driveGroup.position.set(3.1, 0, 0);

    // Concrete Gearbox Pedestal Plinth
    const gearPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 1.8), matConcrete);
    gearPlinth.position.set(0, 0.2, 0);
    driveGroup.add(gearPlinth);

    // Ribbed Double-Reduction Gearbox Housing
    const gearBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.6), matDarkHull);
    gearBox.position.set(0, 1.3, 0);
    gearBox.castShadow = true;
    driveGroup.add(gearBox);

    // Cooling Ribs on Gearbox Faces
    for (let ry = 0.6; ry <= 1.9; ry += 0.3) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.04, 1.64), matSrpPostTrim);
      rib.position.set(0, ry, 0);
      driveGroup.add(rib);
    }

    // Oil Level Sight Glass
    const sightGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), matSrpCounterweight);
    sightGlass.rotation.z = Math.PI / 2;
    sightGlass.position.set(-0.82, 0.9, 0.4);
    driveGroup.add(sightGlass);

    // 45 kW Electric Drive Motor (Behind Gearbox at +X)
    const motorGroup = new THREE.Group();
    motorGroup.position.set(1.4, 0.85, 0);

    const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 20), matSrpPost);
    motorBody.rotation.z = Math.PI / 2;
    motorGroup.add(motorBody);

    // Cooling Fins
    for (let mx = -0.45; mx <= 0.45; mx += 0.15) {
      const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.04, 20), matDarkHull);
      fin.rotation.z = Math.PI / 2;
      fin.position.x = mx;
      motorGroup.add(fin);
    }

    // Cyan Electric Terminal Junction Box
    const termBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), matSrpPostTrim);
    termBox.position.set(0, 0.48, 0);
    motorGroup.add(termBox);

    // V-Belt Safety Guard Cover
    const beltGuard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.35), matDarkHull);
    beltGuard.position.set(-0.75, 0.2, 0);
    motorGroup.add(beltGuard);

    driveGroup.add(motorGroup);
    srpGroup.add(driveGroup);

    // -------------------------------------------------------------------------
    // F. ROTARY CRANKSHAFTS & API CLASS-C SAFETY AMBER COUNTERWEIGHTS
    // -------------------------------------------------------------------------
    // Authentic Crescent Counterweight Shape
    const cwShape = new THREE.Shape();
    cwShape.moveTo(-0.25, -0.85);
    cwShape.bezierCurveTo(-0.85, -0.75, -1.0, 0.75, -0.25, 0.85);
    cwShape.lineTo(0.25, 0.55);
    cwShape.bezierCurveTo(-0.15, 0.35, -0.15, -0.35, 0.25, -0.55);
    cwShape.closePath();

    const cwGeo = new THREE.ExtrudeGeometry(cwShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    cwGeo.center();

    // Helper: Build Crank Assembly (Arm + Amber Counterweight + Wrist Pin)
    const buildCrankAssembly = (zOffset: number) => {
      const crankGroup = new THREE.Group();
      crankGroup.position.set(3.1, 1.5, zOffset);

      // Crank Center Hub
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 24), matDarkHull);
      hub.rotation.x = Math.PI / 2;
      crankGroup.add(hub);

      // Heavy Cast Steel Crank Arm Bar
      const armBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.16), matDarkHull);
      armBar.position.set(0.48, 0, 0);
      crankGroup.add(armBar);

      // Massive Safety Amber Counterweight Lobe
      const weightMesh = new THREE.Mesh(cwGeo, matSrpCounterweight);
      weightMesh.position.set(-0.35, 0, 0);
      weightMesh.castShadow = true;
      crankGroup.add(weightMesh);

      // Black Center Adjustment Slot
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.26), matDarkHull);
      slot.position.set(-0.45, 0, 0);
      crankGroup.add(slot);

      // Wrist Pin (Radius R = 0.95 from center hub)
      const wristPin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 16), matChrome);
      wristPin.rotation.x = Math.PI / 2;
      wristPin.position.set(0.95, 0, 0);
      crankGroup.add(wristPin);

      srpGroup.add(crankGroup);
      return crankGroup;
    };

    const crankL = buildCrankAssembly(-1.15);
    kinematicRefs.current.crankL = crankL;

    const crankR = buildCrankAssembly(1.15);
    kinematicRefs.current.crankR = crankR;

    // -------------------------------------------------------------------------
    // G. TWIN RIGID PITMAN ARMS (Connects Crank Wrist Pin to Walking Beam Tail)
    // -------------------------------------------------------------------------
    // Standard unit cylinder length 4.7, dynamically scaled and oriented in animate()
    const pitmanGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.7, 12);
    const pitmanMeshL = new THREE.Mesh(pitmanGeo, matSrpPitman);
    pitmanMeshL.castShadow = true;
    srpGroup.add(pitmanMeshL);
    kinematicRefs.current.pitmanL = pitmanMeshL;

    const pitmanMeshR = new THREE.Mesh(pitmanGeo, matSrpPitman);
    pitmanMeshR.castShadow = true;
    srpGroup.add(pitmanMeshR);
    kinematicRefs.current.pitmanR = pitmanMeshR;

    srpGroup.userData = { tag: 'SRP-01', name: 'Sucker Rod Pumpjack SRP-01' };
    scene.add(srpGroup);
    interactables['SRP-01'] = srpGroup;

    pinsData.push({
      tag: 'SRP-01',
      title: 'SRP-01',
      subtitle: 'Sucker Rod Pump',
      getMetric: () => `${liveState?.assets['SRP-01']?.telemetry?.strokeRate?.toFixed(1) || '7.2'} SPM • 2.1 mm/s`,
      getStatus: () => liveState?.assets['SRP-01']?.status || 'NORMAL',
      color: '#EAB308',
      worldPos: new THREE.Vector3(18, 7.6, -5)
    });

    // =========================================================================
    // 14. ASSET: OP-01 GATHERING TRUNKLINE & PS-01 BOOSTER PUMP STATION
    // Pipe drops down from SRP-01 to Z = 7, passes through OP-01 and PS-01
    // =========================================================================
    // OP-01 Gathering Trunk Line Segment at X = 11, Z = 7
    const opGroup = new THREE.Group();
    opGroup.position.set(11, 0, 7);
    addEquipmentPad(11, 7, 5, 2.8, 0.35);

    // Check Valve with Flow Indicator Arrow mounted directly on continuous gathering pipeline
    const checkValve = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16), matDarkHull);
    checkValve.rotation.z = Math.PI / 2;
    checkValve.position.y = 1.0;
    opGroup.add(checkValve);

    const flowArrow = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 12), matSafetyYellow);
    flowArrow.rotation.z = Math.PI / 2; // Pointing left toward PS-01 and ST-01!
    flowArrow.position.set(-0.6, 1.0, 0);
    opGroup.add(flowArrow);

    opGroup.userData = { tag: 'OP-01', name: 'Gathering Trunk OP-01' };
    scene.add(opGroup);
    interactables['OP-01'] = opGroup;

    pinsData.push({
      tag: 'OP-01',
      title: 'OP-01',
      subtitle: 'Gathering Trunk',
      getMetric: () => '4,820 BPD',
      getStatus: () => 'NORMAL',
      color: '#F59E0B',
      worldPos: new THREE.Vector3(11, 2.4, 7)
    });

    // PS-01 Booster Pump at X = 2, Z = 7
    const psGroup = new THREE.Group();
    psGroup.position.set(2, 0, 7);
    addEquipmentPad(2, 7, 4.5, 3.0, 0.4);

    // Centrifugal Volute Pump Casing with Impeller Ring
    const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.7, 24), matVesselSteel);
    volute.rotation.z = Math.PI / 2;
    volute.position.set(0.6, 1.0, 0);
    psGroup.add(volute);

    // Electric Drive Motor
    const psMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 20), matDarkHull);
    psMotor.rotation.z = Math.PI / 2;
    psMotor.position.set(-0.8, 1.0, 0);
    psGroup.add(psMotor);

    // Coupling Guard
    const psGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.3, 16), matSafetyYellow);
    psGuard.rotation.z = Math.PI / 2;
    psGuard.position.set(-0.05, 1.0, 0);
    psGroup.add(psGuard);

    psGroup.userData = { tag: 'PS-01', name: 'Booster Pump PS-01' };
    scene.add(psGroup);
    interactables['PS-01'] = psGroup;

    pinsData.push({
      tag: 'PS-01',
      title: 'PS-01',
      subtitle: 'Booster Pump (45 bar)',
      getMetric: () => '45.0 bar',
      getStatus: () => 'NORMAL',
      color: '#06B6D4',
      worldPos: new THREE.Vector3(2, 2.6, 7)
    });

    // =========================================================================
    // 15. ASSET: ST-01 CRUDE STORAGE TANK (API-650 REFINERY TANK)
    // Positioned at X = -16, Z = 7 (Bottom Left, directly below SG-01)
    // Matches the 2D Layout Position!
    // =========================================================================
    const stGroup = new THREE.Group();
    stGroup.position.set(-16, 0, 7);
    addEquipmentPad(-16, 7, 12, 12, 0.5);

    const tankH = 8.5;
    const tankR = 4.8;

    // Tank Shell Cylinder (Vibrant Industrial Safety Amber/Orange)
    const tankShell = new THREE.Mesh(new THREE.CylinderGeometry(tankR, tankR, tankH, 36), matTankShell);
    tankShell.position.y = tankH / 2 + 0.5;
    tankShell.castShadow = true;
    tankShell.receiveShadow = true;
    stGroup.add(tankShell);

    // Structural Stiffening Rings (API-650 Charcoal Wind Girders)
    [2.2, 4.5, 6.8].forEach((ry) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(tankR + 0.03, 0.05, 8, 36),
        matDarkHull
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = ry + 0.5;
      stGroup.add(ring);
    });

    // Conical Roof (Dark Charcoal Steel)
    const tankRoof = new THREE.Mesh(new THREE.ConeGeometry(tankR + 0.2, 1.6, 36), matTankRoof);
    tankRoof.position.y = tankH + 1.3;
    stGroup.add(tankRoof);

    // Roof Eaves Highlight Ring (Golden Amber Accent)
    const roofTrim = new THREE.Mesh(new THREE.TorusGeometry(tankR + 0.2, 0.05, 8, 36), matPumpBeam);
    roofTrim.rotation.x = Math.PI / 2;
    roofTrim.position.y = tankH + 0.52;
    stGroup.add(roofTrim);

    // Perimeter Handrail (High-Visibility Safety Yellow)
    const handrail = new THREE.Mesh(new THREE.TorusGeometry(tankR + 0.05, 0.04, 8, 36), matSafetyYellow);
    handrail.rotation.x = Math.PI / 2;
    handrail.position.y = tankH + 0.55;
    stGroup.add(handrail);

    // Spiral External Staircase (Dark Slate Structural Steel Steps)
    for (let i = 0; i < 22; i++) {
      const theta = (i / 22) * Math.PI * 1.5;
      const stepY = 0.5 + (i / 22) * tankH;
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.35), matDarkHull);
      step.position.set(
        Math.cos(theta) * (tankR + 0.55),
        stepY,
        Math.sin(theta) * (tankR + 0.55)
      );
      step.rotation.y = -theta;
      stGroup.add(step);
    }

    // Inflow Manifold Connection Flange & Tank Block Valve
    const tankInletFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 20), matDarkHull);
    tankInletFlange.rotation.z = Math.PI / 2;
    tankInletFlange.position.set(4.8, 1.0, 0);
    stGroup.add(tankInletFlange);

    const tankInletValve = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matDarkHull);
    tankInletValve.position.set(4.3, 1.0, 0);
    stGroup.add(tankInletValve);

    const tankInletWheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), matValveRed);
    tankInletWheel.rotation.x = Math.PI / 2;
    tankInletWheel.position.set(4.3, 1.4, 0);
    stGroup.add(tankInletWheel);

    // Front Telemetry Cutaway Gauge Window showing LIVE LIQUID LEVEL!
    const fillLevelPct = liveState?.assets['ST-01']?.telemetry?.levelPct ? Math.max(92.0, liveState.assets['ST-01'].telemetry.levelPct) : 96.5;
    const liquidHeight = (tankH * 0.85) * (fillLevelPct / 100);
    const liquidGeo = new THREE.CylinderGeometry(0.12, 0.12, liquidHeight, 16);
    const liquidMesh = new THREE.Mesh(
      liquidGeo,
      new THREE.MeshBasicMaterial({ color: '#F59E0B' })
    );
    liquidMesh.position.set(0, (liquidHeight / 2) + 0.8, tankR + 0.15);
    stGroup.add(liquidMesh);
    kinematicRefs.current.tankLiquidMesh = liquidMesh;

    // Sight Glass Frame
    const glassFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, tankH * 0.85, 16),
      matGlass
    );
    glassFrame.position.set(0, (tankH * 0.85) / 2 + 0.8, tankR + 0.15);
    stGroup.add(glassFrame);

    stGroup.userData = { tag: 'ST-01', name: 'Field Crude Storage Tank ST-01' };
    scene.add(stGroup);
    interactables['ST-01'] = stGroup;

    pinsData.push({
      tag: 'ST-01',
      title: 'ST-01',
      subtitle: 'Crude Storage Tank',
      getMetric: () => `${fillLevelPct.toFixed(1)}% Fill • 3,420 m³ Net`,
      getStatus: () => 'NORMAL',
      color: '#F59E0B',
      worldPos: new THREE.Vector3(-16, 10.5, 7)
    });

    interactablesRef.current = interactables;
    pinsDataRef.current = pinsData;
    kinematicRefs.current.beaconRings = beaconRings;

    // =========================================================================
    // 16. CONTINUOUS INDUSTRIAL OIL PIPELINE & FLUID FLOW PATHS
    // Unbroken physical pipeline from Reservoir -> PW-01 -> SRP-01 -> OP-01 -> PS-01 -> ST-01
    // Matching 100% inside physical pipe trajectories with centripetal Catmull-Rom splines!
    // =========================================================================

    // Orthogonal Waypoints for Crude Oil Gathering Network
    const oilWaypoints: THREE.Vector3[] = [
      new THREE.Vector3(8.8, -7.6, -5.0),   // Submerged suction intake at right reservoir cutaway wall (Y = -7.6)
      new THREE.Vector3(11.0, -7.6, -5.0),  // PW-01 Downhole Production Casing base
      new THREE.Vector3(11.0, 0.0, -5.0),   // PW-01 Cellar floor
      new THREE.Vector3(11.0, 1.35, -5.0),  // PW-01 Surface Christmas Tree Flow Tee
      new THREE.Vector3(13.5, 1.35, -5.0),  // Connects flush into SRP-01 Wellhead Pumping Flow Tee
      new THREE.Vector3(18.0, 1.35, -5.0),  // East edge of Pumpjack foundation pad
      new THREE.Vector3(18.0, 1.0, 7.0),    // 90° Turn South into Gathering Trunk Corridor
      new THREE.Vector3(14.0, 1.0, 7.0),    // Horizontal run along Z = 7 across facility floor
      new THREE.Vector3(11.0, 1.0, 7.0),    // OP-01 Gathering Trunk check valve station
      new THREE.Vector3(2.6, 1.0, 7.0),     // PS-01 Booster Pump Suction Flange
      new THREE.Vector3(1.4, 1.0, 7.0),     // PS-01 Booster Pump Discharge Flange
      new THREE.Vector3(-6.0, 1.0, 7.0),    // Pipeline run West towards Tank Battery
      new THREE.Vector3(-11.2, 1.0, 7.0),   // ST-01 Storage Tank Flanged Intake Nozzle
    ];

    // Build Continuous Physical Oil Gathering Pipeline
    buildContinuousIndustrialPipeline(oilWaypoints, 0.24, matPipeOilLine, matPipeFitting, {
      addIntermediateFlanges: true,
      addGroundSupports: true,
      groundY: 0,
    });

    // Concrete Pipe Sleepers supporting Oil Line along Z = 7 ground corridor
    const sleeperX = [16, 7.5, -2, -8.5];
    sleeperX.forEach((sx) => {
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 1.2), matConcrete);
      sleeper.position.set(sx, 0.175, 7.0);
      sleeper.castShadow = true;
      scene.add(sleeper);

      const cradle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), matPipeFitting);
      cradle.position.set(sx, 0.39, 7.0);
      scene.add(cradle);
    });

    // 1. Steam Spline 1 (Centripetal with corner beveling - stays 100% inside physical pipes!)
    const curveSteam1 = new THREE.CatmullRomCurve3(generateBeveledSpline(steamWaypoints1, 0.45), false, 'centripetal');

    // 2. Steam Spline 2
    const curveSteam2 = new THREE.CatmullRomCurve3(generateBeveledSpline(steamWaypoints2, 0.45), false, 'centripetal');

    // 3. Oil Production Spline
    const curveOil = new THREE.CatmullRomCurve3(generateBeveledSpline(oilWaypoints, 0.45), false, 'centripetal');

    // 3D Dashed Flow Tubes (Slightly smaller radius than physical pipes so glowing core shines through)
    const addDashedTube = (curve: THREE.CatmullRomCurve3, tex: THREE.CanvasTexture, radius: number = 0.09) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 128, radius, 12, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
      return { mesh: tubeMesh, tex };
    };

    const dashedSteam1 = addDashedTube(curveSteam1, textures.dashedWhiteTex, 0.08);
    const dashedSteam2 = addDashedTube(curveSteam2, sp02Warning ? textures.dashedRedTex : textures.dashedWhiteTex, 0.08);
    const dashedOil = addDashedTube(curveOil, textures.dashedAmberTex, 0.075);

    kinematicRefs.current.dashedSteamTex1 = dashedSteam1.tex;
    kinematicRefs.current.dashedSteamTex2 = dashedSteam2.tex;
    kinematicRefs.current.dashedOilTex = dashedOil.tex;

    // Glowing Particle Engines following Splines
    const particleCountPerLoop = 90;

    // Steam Particles 1 (Pure Radiant White Superheated Steam)
    const p1Geo = new THREE.BufferGeometry();
    const p1Pos = new Float32Array(particleCountPerLoop * 3);
    const p1Progress = new Float32Array(particleCountPerLoop);
    for (let i = 0; i < particleCountPerLoop; i++) {
      p1Progress[i] = i / particleCountPerLoop;
      const pt = curveSteam1.getPoint(p1Progress[i]);
      p1Pos[i * 3] = pt.x;
      p1Pos[i * 3 + 1] = pt.y;
      p1Pos[i * 3 + 2] = pt.z;
    }
    p1Geo.setAttribute('position', new THREE.BufferAttribute(p1Pos, 3));
    const p1Mat = new THREE.PointsMaterial({
      map: textures.glowDotTex,
      color: '#FFFFFF',
      size: 0.75,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const steamPoints1 = new THREE.Points(p1Geo, p1Mat);
    scene.add(steamPoints1);
    kinematicRefs.current.steamParticles1 = steamPoints1;

    // Steam Particles 2
    const p2Geo = new THREE.BufferGeometry();
    const p2Pos = new Float32Array(particleCountPerLoop * 3);
    const p2Progress = new Float32Array(particleCountPerLoop);
    for (let i = 0; i < particleCountPerLoop; i++) {
      p2Progress[i] = i / particleCountPerLoop;
      const pt = curveSteam2.getPoint(p2Progress[i]);
      p2Pos[i * 3] = pt.x;
      p2Pos[i * 3 + 1] = pt.y;
      p2Pos[i * 3 + 2] = pt.z;
    }
    p2Geo.setAttribute('position', new THREE.BufferAttribute(p2Pos, 3));
    const p2Mat = new THREE.PointsMaterial({
      map: textures.glowDotTex,
      color: sp02Warning ? '#F43F5E' : '#FFFFFF',
      size: sp02Warning ? 0.85 : 0.75,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const steamPoints2 = new THREE.Points(p2Geo, p2Mat);
    scene.add(steamPoints2);
    kinematicRefs.current.steamParticles2 = steamPoints2;

    // Crude Oil Particles
    const oilCount = 120;
    const oilGeo = new THREE.BufferGeometry();
    const oilPos = new Float32Array(oilCount * 3);
    const oilProgress = new Float32Array(oilCount);
    for (let i = 0; i < oilCount; i++) {
      oilProgress[i] = i / oilCount;
      const pt = curveOil.getPoint(oilProgress[i]);
      oilPos[i * 3] = pt.x;
      oilPos[i * 3 + 1] = pt.y;
      oilPos[i * 3 + 2] = pt.z;
    }
    oilGeo.setAttribute('position', new THREE.BufferAttribute(oilPos, 3));
    const oilMat = new THREE.PointsMaterial({
      color: '#F59E0B',
      size: 0.55,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const oilPoints = new THREE.Points(oilGeo, oilMat);
    scene.add(oilPoints);
    kinematicRefs.current.oilParticles = oilPoints;

    // -------------------------------------------------------------------------
    // 17. MAIN ANIMATION LOOP (With Smooth Camera Tweening)
    // -------------------------------------------------------------------------
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth Camera Tweening
      if (isCameraTweeningRef.current && camera && controls) {
        camera.position.lerp(camTargetPosRef.current, 0.08);
        controls.target.lerp(controlsTargetPosRef.current, 0.08);
        if (camera.position.distanceTo(camTargetPosRef.current) < 0.1) {
          isCameraTweeningRef.current = false;
        }
      }

      // Rotate Floor Projectors
      if (kinematicRefs.current.beaconRings) {
        kinematicRefs.current.beaconRings.forEach((ring, idx) => {
          ring.rotation.z += (idx % 2 === 0 ? 0.005 : -0.005);
        });
      }

      // Fluid Flow Animation
      if (isFlowPlaying) {
        const speed = flowSpeedMultiplier;
        const steamSpeed = (isUnsafe ? 2.2 : 1.0) * delta * 0.8 * speed;

        if (kinematicRefs.current.dashedSteamTex1) {
          kinematicRefs.current.dashedSteamTex1.offset.x -= steamSpeed;
        }
        if (kinematicRefs.current.dashedSteamTex2) {
          kinematicRefs.current.dashedSteamTex2.offset.x -= (sp02Warning ? 2.2 : 1.0) * delta * 0.8 * speed;
        }
        if (kinematicRefs.current.dashedOilTex) {
          kinematicRefs.current.dashedOilTex.offset.x -= delta * 0.65 * speed;
        }

        // Animate Spline Particles
        if (kinematicRefs.current.steamParticles1) {
          const positions = kinematicRefs.current.steamParticles1.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCountPerLoop; i++) {
            p1Progress[i] += delta * 0.16 * speed;
            if (p1Progress[i] > 1.0) p1Progress[i] -= 1.0;
            const pt = curveSteam1.getPoint(p1Progress[i]);
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;
          }
          kinematicRefs.current.steamParticles1.geometry.attributes.position.needsUpdate = true;
        }

        if (kinematicRefs.current.steamParticles2) {
          const positions = kinematicRefs.current.steamParticles2.geometry.attributes.position.array as Float32Array;
          const sp2Rate = sp02Warning ? 0.32 : 0.16;
          for (let i = 0; i < particleCountPerLoop; i++) {
            p2Progress[i] += delta * sp2Rate * speed;
            if (p2Progress[i] > 1.0) p2Progress[i] -= 1.0;
            const pt = curveSteam2.getPoint(p2Progress[i]);
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;
          }
          kinematicRefs.current.steamParticles2.geometry.attributes.position.needsUpdate = true;
        }

        if (kinematicRefs.current.oilParticles) {
          const positions = kinematicRefs.current.oilParticles.geometry.attributes.position.array as Float32Array;
          const oilRate = (isSimulatedMode ? 0.18 : 0.12) * speed;
          for (let i = 0; i < oilCount; i++) {
            oilProgress[i] += delta * oilRate;
            if (oilProgress[i] > 1.0) oilProgress[i] -= 1.0;
            const pt = curveOil.getPoint(oilProgress[i]);
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;
          }
          kinematicRefs.current.oilParticles.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Sucker Rod Pump Mechanics (4-Bar Linkage Synchronized Kinematics)
      const strokeSpeed = (liveState?.assets['SRP-01']?.telemetry?.strokeRate || 7.2) * 0.38;
      const theta = elapsed * strokeSpeed; // crank rotation angle
      const angle = Math.sin(theta) * 0.165; // walking beam rocking tilt

      if (kinematicRefs.current.walkingBeam) {
        kinematicRefs.current.walkingBeam.rotation.z = angle;
      }
      if (kinematicRefs.current.crankL) {
        kinematicRefs.current.crankL.rotation.z = -theta;
      }
      if (kinematicRefs.current.crankR) {
        kinematicRefs.current.crankR.rotation.z = -theta;
      }

      // Dynamic Pitman Connecting Arms (Crank Wrist Pin -> Tail Equalizer Pin)
      const crankRadius = 0.95;
      const pinX = 3.1 + crankRadius * Math.cos(-theta);
      const pinY = 1.5 + crankRadius * Math.sin(-theta);
      const tailX = 3.5 * Math.cos(angle);
      const tailY = 6.2 + 3.5 * Math.sin(angle);

      const pPin = new THREE.Vector3(pinX, pinY, 0);
      const pTail = new THREE.Vector3(tailX, tailY, 0);
      const pitmanDir = new THREE.Vector3().subVectors(pTail, pPin);
      const pitmanLen = pitmanDir.length();
      const pitmanMid = new THREE.Vector3().addVectors(pPin, pTail).multiplyScalar(0.5);
      const pitmanQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pitmanDir.normalize());

      if (kinematicRefs.current.pitmanL) {
        kinematicRefs.current.pitmanL.position.set(pitmanMid.x, pitmanMid.y, -1.15);
        kinematicRefs.current.pitmanL.quaternion.copy(pitmanQuat);
        kinematicRefs.current.pitmanL.scale.set(1, pitmanLen / 4.7, 1);
      }
      if (kinematicRefs.current.pitmanR) {
        kinematicRefs.current.pitmanR.position.set(pitmanMid.x, pitmanMid.y, 1.15);
        kinematicRefs.current.pitmanR.quaternion.copy(pitmanQuat);
        kinematicRefs.current.pitmanR.scale.set(1, pitmanLen / 4.7, 1);
      }

      // Synchronized Polished Rod, Carrier Bar & Bridle Cables
      const frontTipY = 6.2 - 3.8 * Math.sin(angle);
      const rodY = frontTipY - 1.4;
      if (kinematicRefs.current.polishedRod) {
        kinematicRefs.current.polishedRod.position.set(-4.5, rodY - 1.2, 0);
      }
      if (kinematicRefs.current.carrierBar) {
        kinematicRefs.current.carrierBar.position.set(-4.5, rodY + 1.8, 0);
      }
      if (kinematicRefs.current.bridleL && kinematicRefs.current.bridleR) {
        const cableTopY = frontTipY + 0.35;
        const cableBotY = rodY + 1.8;
        const cableH = Math.max(0.2, cableTopY - cableBotY);
        const cableMidY = (cableTopY + cableBotY) / 2;
        kinematicRefs.current.bridleL.position.set(-4.5, cableMidY, -0.22);
        kinematicRefs.current.bridleL.scale.set(1, cableH / 2.0, 1);
        kinematicRefs.current.bridleR.position.set(-4.5, cableMidY, 0.22);
        kinematicRefs.current.bridleR.scale.set(1, cableH / 2.0, 1);
      }

      // Boiler Burner Flame Pulse
      if (kinematicRefs.current.burnerLight) {
        kinematicRefs.current.burnerLight.intensity = 4.2 + Math.sin(elapsed * 9) * 1.4;
      }

      // Reservoir Dual-Phase Thermal Stimulation & Extraction Kinematics
      // Reservoir Subsurface Thermodynamics & Volumetric Fluid Dynamics
      if (kinematicRefs.current.thermalSteamCore) {
        const cScale = 1.0 + Math.sin(elapsed * 2.5) * 0.04;
        kinematicRefs.current.thermalSteamCore.scale.set(cScale, cScale, cScale);
      }
      if (kinematicRefs.current.thermalFront) {
        const fScale = 1.0 + Math.sin(elapsed * 2.0) * 0.05;
        kinematicRefs.current.thermalFront.scale.set(fScale, fScale, fScale);
      }
      if (kinematicRefs.current.reservoirLight) {
        kinematicRefs.current.reservoirLight.intensity = (isUnsafe ? 4.5 : 3.0) + Math.sin(elapsed * 3.0) * 0.5;
      }

      // 1. High-Velocity Radial Steam Mist Plumes (Injection Nozzles)
      if (
        isFlowPlaying &&
        kinematicRefs.current.steamMistPoints &&
        kinematicRefs.current.steamMistProgress &&
        kinematicRefs.current.steamMistOrigins &&
        kinematicRefs.current.steamMistDirs
      ) {
        const smSpeed = flowSpeedMultiplier * delta * 0.45;
        const pts = kinematicRefs.current.steamMistPoints;
        const progress = kinematicRefs.current.steamMistProgress;
        const origins = kinematicRefs.current.steamMistOrigins;
        const dirs = kinematicRefs.current.steamMistDirs;
        const posArray = pts.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < progress.length; i++) {
          progress[i] = (progress[i] + smSpeed) % 1.0;
          const u = progress[i];
          const dist = Math.pow(u, 0.75) * 2.4; // High initial ejection velocity, decelerating as it expands
          posArray[i * 3] = origins[i].x + dirs[i].x * dist;
          posArray[i * 3 + 1] = origins[i].y + dirs[i].y * dist;
          posArray[i * 3 + 2] = origins[i].z + dirs[i].z * dist;
        }
        pts.geometry.attributes.position.needsUpdate = true;
      }

      // 2. Viscous Heavy Crude Oil Liquid Dynamics (Living Floating Undulating Pool)
      if (kinematicRefs.current.oilLiquidMesh) {
        const mesh = kinematicRefs.current.oilLiquidMesh;
        const posAttr = mesh.geometry.attributes.position;
        const posArr = posAttr.array as Float32Array;
        const tWave = elapsed * 1.5;
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posArr[i * 3];
          const vy = posArr[i * 3 + 1];
          // Dual-frequency viscous fluid waves: heavy swell + micro capillary ripples
          const heavySwell = Math.sin(vx * 0.65 + tWave) * 0.065 + Math.cos(vy * 0.6 + tWave * 0.85) * 0.045;
          const microRipple = Math.sin(vx * 2.2 + tWave * 1.8) * 0.016 + Math.cos(vy * 2.0 - tWave * 1.4) * 0.012;
          posArr[i * 3 + 2] = heavySwell + microRipple;
        }
        posAttr.needsUpdate = true;
      }

      // Petroleum Thin-Film Iridescence Sheen Swirl
      if (isFlowPlaying && kinematicRefs.current.oilIridescenceTex) {
        kinematicRefs.current.oilIridescenceTex.offset.x += delta * 0.012 * flowSpeedMultiplier;
        kinematicRefs.current.oilIridescenceTex.offset.y += delta * 0.008 * flowSpeedMultiplier;
      }

      // Organic Viscous Petroleum Eddies & Slicks (Smooth Rotation, Fluid Breathing, Subtle Orbit)
      if (kinematicRefs.current.oilViscousEddies) {
        const eddies = kinematicRefs.current.oilViscousEddies;
        for (let i = 0; i < eddies.length; i++) {
          const ed = eddies[i];
          ed.angle += delta * ed.rotSpeed * flowSpeedMultiplier;
          ed.mesh.rotation.z = ed.angle;

          // Gentle fluid breathing / stretch
          const breathe = 1.0 + Math.sin(elapsed * 2.2 + i * 1.1) * 0.12;
          ed.mesh.scale.set(breathe, 1.0, breathe * (0.9 + Math.cos(elapsed * 1.8 + i) * 0.1));

          // Subtle viscous orbital drift
          const driftX = Math.cos(elapsed * 0.4 + i) * 0.15;
          const driftZ = Math.sin(elapsed * 0.45 + i) * 0.15;
          ed.mesh.position.set(ed.centerX + driftX, -6.98, ed.centerZ + driftZ);
        }
      }

      // Subsurface Oil Migration Currents toward Suction Intake
      if (isFlowPlaying && kinematicRefs.current.oilMigrationPoints && kinematicRefs.current.oilMigrationData) {
        const migPts = kinematicRefs.current.oilMigrationPoints;
        const migD = kinematicRefs.current.oilMigrationData;
        const posArray = migPts.geometry.attributes.position.array as Float32Array;
        const colArray = migPts.geometry.attributes.color.array as Float32Array;
        const d = delta * flowSpeedMultiplier;

        for (let i = 0; i < migD.x.length; i++) {
          // Migrate toward suction bellmouth at (5.75, -7.6, 0)
          const targetX = 5.70;
          const targetY = -7.60;
          const targetZ = 0.0;

          const dx = targetX - migD.x[i];
          const dy = targetY - migD.y[i];
          const dz = targetZ - migD.z[i];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 0.3 || migD.x[i] >= 5.65) {
            // Respawn across reservoir
            migD.x[i] = -4.5 + Math.random() * 4.0;
            migD.y[i] = -7.2 - Math.random() * 0.9;
            migD.z[i] = (Math.random() - 0.5) * 8.0;
          } else {
            const v = migD.speed[i] * d;
            migD.x[i] += (dx / dist) * v * 1.4;
            migD.y[i] += (dy / dist) * v * 0.5;
            migD.z[i] += (dz / dist) * v * 0.8;

            posArray[i * 3] = migD.x[i];
            posArray[i * 3 + 1] = migD.y[i];
            posArray[i * 3 + 2] = migD.z[i];

            // Faint glow near suction
            const proxGlow = Math.min(1.0, 0.4 + (1.0 - Math.min(dist / 6.0, 1.0)) * 0.6);
            colArray[i * 3] = 0.95 * proxGlow;
            colArray[i * 3 + 1] = 0.60 * proxGlow;
            colArray[i * 3 + 2] = 0.15 * proxGlow;
          }
        }
        migPts.geometry.attributes.position.needsUpdate = true;
        migPts.geometry.attributes.color.needsUpdate = true;
      }

      // 3. Volumetric Steam Injection Flare & Vapor Blanket
      if (kinematicRefs.current.steamChestCore) {
        const jetPulse = 1.0 + Math.sin(elapsed * 6.0) * 0.04;
        kinematicRefs.current.steamChestCore.scale.set(jetPulse, 1.0, jetPulse);
      }

      // Atmospheric Vapor Blanket Rolling Over Crude Oil
      if (kinematicRefs.current.steamBlanket && kinematicRefs.current.steamBlanketBaseY) {
        const bMesh = kinematicRefs.current.steamBlanket;
        const bBaseY = kinematicRefs.current.steamBlanketBaseY;
        const bPosAttr = bMesh.geometry.attributes.position;
        const bArr = bPosAttr.array as Float32Array;
        const tVapor = elapsed * 2.2;
        for (let i = 0; i < bBaseY.length; i++) {
          const vx = bArr[i * 3];
          const vz = bArr[i * 3 + 2];
          bArr[i * 3 + 1] = bBaseY[i] + Math.sin(vx * 1.2 + tVapor) * 0.035 + Math.cos(vz * 1.1 + tVapor * 0.85) * 0.025;
        }
        bPosAttr.needsUpdate = true;
      }

      // Radiant Thermal Melting & Liquefaction Zone on Crude Oil Surface
      if (kinematicRefs.current.thermalMeltZone) {
        const meltPulse = 1.0 + Math.sin(elapsed * 3.4) * 0.045;
        kinematicRefs.current.thermalMeltZone.scale.set(meltPulse, 1.0, meltPulse);
        const mMat = kinematicRefs.current.thermalMeltZone.material as THREE.MeshBasicMaterial;
        if (mMat) {
          mMat.opacity = 0.90 + Math.sin(elapsed * 4.2) * 0.08;
        }
      }

      // Concentric Thermal Heat Dissipation Wavefronts (Rippling across oil pool)
      if (kinematicRefs.current.thermalHeatWaves) {
        kinematicRefs.current.thermalHeatWaves.forEach((hw) => {
          hw.phase = (hw.phase + delta * 0.42 * flowSpeedMultiplier) % 1.0;
          const sc = hw.baseScale * (1.0 + hw.phase * 2.4);
          hw.mesh.scale.set(sc, 1.0, sc);
          const wMat = hw.mesh.material as THREE.MeshBasicMaterial;
          if (wMat) {
            wMat.opacity = Math.sin(hw.phase * Math.PI) * 0.72;
          }
        });
      }

      // Molten Boiling Micro-Vortices on Liquefaction Zone
      if (kinematicRefs.current.boilMicroRings) {
        kinematicRefs.current.boilMicroRings.forEach((bm) => {
          bm.angle += delta * bm.speed * flowSpeedMultiplier;
          const offX = Math.cos(bm.angle) * bm.radius;
          const offZ = Math.sin(bm.angle) * bm.radius;
          bm.mesh.position.set(bm.centerX + offX, -6.96, bm.centerZ + offZ);
          const bScale = 1.0 + Math.sin(bm.angle * 3.0) * 0.28;
          bm.mesh.scale.set(bScale, bScale, 1.0);
        });
      }

      // Volumetric Thermodynamic Steam Mist Particles Advection (Strict Box Confinement)
      if (isFlowPlaying && kinematicRefs.current.steamMistVaporPoints && kinematicRefs.current.steamMistData) {
        const pts = kinematicRefs.current.steamMistVaporPoints;
        const data = kinematicRefs.current.steamMistData;
        const posArray = pts.geometry.attributes.position.array as Float32Array;
        const colArray = pts.geometry.attributes.color.array as Float32Array;
        const d = delta * flowSpeedMultiplier;

        for (let i = 0; i < data.life.length; i++) {
          data.life[i] += d;

          // Strict boundary enforcement:
          // Respawn if life expired OR if particle reaches X >= 4.4 (well inside box wall at 5.8)
          if (data.life[i] >= data.maxLife[i] || data.x[i] >= 4.4) {
            data.life[i] = 0;
            data.x[i] = -1.35 + (Math.random() - 0.5) * 0.05;
            data.y[i] = -5.56 + (Math.random() - 0.5) * 0.05;
            data.z[i] = (Math.random() - 0.5) * 0.05;

            const angleY = -0.38 + (Math.random() - 0.5) * 0.24;
            const angleZ = (Math.random() - 0.5) * 0.32;
            const speed = 1.6 + Math.random() * 1.1;
            data.vx[i] = Math.cos(angleY) * Math.cos(angleZ) * speed;
            data.vy[i] = Math.sin(angleY) * speed;
            data.vz[i] = Math.sin(angleZ) * speed;

            posArray[i * 3] = data.x[i];
            posArray[i * 3 + 1] = data.y[i];
            posArray[i * 3 + 2] = data.z[i];
            colArray[i * 3] = 1.0;
            colArray[i * 3 + 1] = 0.95;
            colArray[i * 3 + 2] = 0.90;
          } else {
            // Advection step
            data.x[i] += data.vx[i] * d;
            data.y[i] += data.vy[i] * d;
            data.z[i] += data.vz[i] * d;

            // When reaching crude oil surface (Y = -6.95), particles spread across the pool
            if (data.y[i] <= -6.92) {
              data.y[i] = -6.92;
              data.vx[i] *= 0.86; // Decelerate forward jet
              data.vy[i] = 0.04 + Math.random() * 0.08; // Buoyant lift
              if (Math.abs(data.vz[i]) < 0.18) {
                data.vz[i] = (Math.random() - 0.5) * 0.65;
              }
            } else if (data.y[i] > -6.85 && data.x[i] > 0.4) {
              // Convective thermal upward curl
              data.vy[i] += 0.014 * d;
              if (data.y[i] > -4.6) {
                data.vy[i] = -0.015; // Stay below caprock ceiling
              }
            }

            // Micro-turbulence
            const turbY = Math.sin(elapsed * 3.5 + i) * 0.02;
            const turbZ = Math.cos(elapsed * 3.0 + i) * 0.02;

            posArray[i * 3] = data.x[i];
            posArray[i * 3 + 1] = data.y[i] + turbY;
            posArray[i * 3 + 2] = data.z[i] + turbZ;

            // Smooth fade out between X = 2.8 and X = 4.4 so particles gracefully vanish inside the box
            const fade = Math.max(0, Math.min(1, (4.4 - data.x[i]) / 1.6));
            colArray[i * 3] = 1.0 * fade;
            colArray[i * 3 + 1] = (0.94 + (i % 5) * 0.01) * fade;
            colArray[i * 3 + 2] = (0.88 + (i % 7) * 0.015) * fade;
          }
        }
        pts.geometry.attributes.position.needsUpdate = true;
        pts.geometry.attributes.color.needsUpdate = true;
      }

      // Steam Injection Point Light Radiant Flicker
      if (kinematicRefs.current.steamInjectionLight) {
        kinematicRefs.current.steamInjectionLight.intensity = 3.2 + Math.sin(elapsed * 7.5) * 0.45;
      }

      if (kinematicRefs.current.caprockBreachRing && isUnsafe) {
        kinematicRefs.current.caprockBreachRing.rotation.z += delta * 2.0;
        const rScale = 1.0 + Math.sin(elapsed * 6) * 0.25;
        kinematicRefs.current.caprockBreachRing.scale.set(rScale, rScale, 1);
      }

      // Project 3D HUD Pins to Screen Coordinates
      if (container && camera) {
        const cWidth = container.clientWidth;
        const cHeight = container.clientHeight;
        const tempV = new THREE.Vector3();

        const updated = pinsDataRef.current.map((p) => {
          tempV.copy(p.worldPos);
          tempV.project(camera);
          const isVisible = tempV.z < 1 && tempV.x > -1.1 && tempV.x < 1.1 && tempV.y > -1.1 && tempV.y < 1.1;
          const sx = (tempV.x * 0.5 + 0.5) * cWidth;
          const sy = (-(tempV.y * 0.5) + 0.5) * cHeight;
          return {
            tag: p.tag,
            title: p.title,
            subtitle: p.subtitle,
            metric: p.getMetric(),
            status: p.getStatus(),
            color: p.color,
            worldPos: p.worldPos,
            screenPos: { x: sx, y: sy, visible: isVisible }
          };
        });
        setHudPins(updated);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------------------
    // 18. RAYCASTING INTERACTION
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const objectsToTest = Object.values(interactables);
      const intersects = raycaster.intersectObjects(objectsToTest, true);

      if (intersects.length > 0) {
        let topObj: THREE.Object3D | null = intersects[0].object;
        while (topObj && !topObj.userData?.tag && topObj.parent) {
          topObj = topObj.parent;
        }

        if (topObj && topObj.userData?.tag) {
          setHoveredAsset(topObj.userData.tag);
          container.style.cursor = 'pointer';
          return;
        }
      }

      setHoveredAsset(null);
      container.style.cursor = 'default';
    };

    const handlePointerClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const objectsToTest = Object.values(interactables);
      const intersects = raycaster.intersectObjects(objectsToTest, true);

      if (intersects.length > 0) {
        let topObj: THREE.Object3D | null = intersects[0].object;
        while (topObj && !topObj.userData?.tag && topObj.parent) {
          topObj = topObj.parent;
        }

        if (topObj && topObj.userData?.tag) {
          onAssetClick(topObj.userData.tag);
        }
      }
    };

    const handlePointerLeave = () => {
      setHoveredAsset(null);
      container.style.cursor = 'default';
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);
    container.addEventListener('click', handlePointerClick);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 660;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseleave', handlePointerLeave);
      container.removeEventListener('click', handlePointerClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isSimulatedMode, isUnsafe, textures, isFlowPlaying, flowSpeedMultiplier]);

  // Smooth Camera Preset Controller
  const applyCameraPreset = (preset: 'schematic' | 'orbit' | 'boiler' | 'reservoir' | 'pump' | 'tank') => {
    setActiveCamPreset(preset);
    isCameraTweeningRef.current = true;

    if (preset === 'schematic') {
      camTargetPosRef.current.set(0, 42, 38);
      controlsTargetPosRef.current.set(0, 0, 0);
    } else if (preset === 'orbit') {
      camTargetPosRef.current.set(22, 28, 32);
      controlsTargetPosRef.current.set(0, 2, 0);
    } else if (preset === 'boiler') {
      camTargetPosRef.current.set(-20, 14, 8);
      controlsTargetPosRef.current.set(-20, 3, -5);
    } else if (preset === 'reservoir') {
      camTargetPosRef.current.set(4, 8, 16);
      controlsTargetPosRef.current.set(3, -5, -5);
    } else if (preset === 'pump') {
      camTargetPosRef.current.set(18, 12, 10);
      controlsTargetPosRef.current.set(18, 4, -5);
    } else if (preset === 'tank') {
      camTargetPosRef.current.set(-16, 14, 20);
      controlsTargetPosRef.current.set(-16, 5, 7);
    }
  };

  // Helper to render rich telemetry metrics inside the unified inspection card
  const renderPinTelemetry = (tag: string) => {
    const asset = liveState?.assets[tag];
    const t = asset?.telemetry;

    if (tag === 'SG-01') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Pressure:</span>
            <span className="font-semibold text-cyan-300">{t?.pressure?.toFixed(1) || '88.0'} bar</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Temperature:</span>
            <span className="font-semibold text-amber-300">{t?.temperature?.toFixed(1) || '289.0'} °C</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Enthalpy:</span>
            <span className="font-semibold text-slate-200">OTSG High-Pressure</span>
          </div>
        </div>
      );
    }
    if (tag.startsWith('SP')) {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Inlet:</span>
            <span className="font-semibold text-cyan-300">{t?.inletPressure?.toFixed(1) || '88.0'} bar</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Delivery:</span>
            <span className="font-semibold text-cyan-300">{t?.outletPressure?.toFixed(1) || '85.8'} bar</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Transit Loss:</span>
            <span className="font-semibold text-amber-300">{t?.heatLoss?.toFixed(1) || '4.1'}%</span>
          </div>
        </div>
      );
    }
    if (tag.startsWith('IW')) {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Wellhead:</span>
            <span className="font-semibold text-cyan-300">{t?.wellheadPressure?.toFixed(1) || '80.0'} bar</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Target Depth:</span>
            <span className="font-semibold text-slate-200">950 m (Formation)</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Cycle:</span>
            <span className="font-semibold text-emerald-300">CSS Stimulated Phase</span>
          </div>
        </div>
      );
    }
    if (tag === 'R-01') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Formation:</span>
            <span className="font-semibold text-slate-200">Bitumen Sandstone</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Reservoir Temp:</span>
            <span className="font-semibold text-amber-300">{simSummary?.predictedReservoirTemp || 183.5} °C</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Viscosity:</span>
            <span className="font-semibold text-cyan-300">18 cP (Stimulated)</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Caprock:</span>
            <span className={`font-semibold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
              {isUnsafe ? '⚠️ BREACH HAZARD' : '100% Sealed (94 bar)'}
            </span>
          </div>
        </div>
      );
    }
    if (tag === 'PW-01') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Crude Rate:</span>
            <span className="font-semibold text-amber-300">{t?.flowRate?.toFixed(1) || '440.7'} BPD</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Lift Method:</span>
            <span className="font-semibold text-slate-200">SRP Artificial Lift</span>
          </div>
        </div>
      );
    }
    if (tag === 'SRP-01') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Stroke Rate:</span>
            <span className="font-semibold text-cyan-300">{t?.strokeRate?.toFixed(1) || '7.2'} SPM</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Rod Vibration:</span>
            <span className="font-semibold text-amber-300">{t?.vibration?.toFixed(2) || '2.10'} mm/s</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Motor Temp:</span>
            <span className="font-semibold text-slate-200">{t?.motorTemp?.toFixed(1) || '62.0'} °C</span>
          </div>
        </div>
      );
    }
    if (tag === 'OP-01') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Line Type:</span>
            <span className="font-semibold text-slate-200">Gathering Trunk</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Net Flow:</span>
            <span className="font-semibold text-amber-300">4,820 BPD Net</span>
          </div>
        </div>
      );
    }
    if (tag === 'PS-01') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Booster Head:</span>
            <span className="font-semibold text-cyan-300">45.0 bar</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Pump Status:</span>
            <span className="font-semibold text-emerald-300">Centrifugal Active</span>
          </div>
        </div>
      );
    }
    if (tag === 'ST-01') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Fill Level:</span>
            <span className="font-semibold text-amber-300">{t?.levelPct?.toFixed(1) || '68.4'}%</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Net Inventory:</span>
            <span className="font-semibold text-cyan-300">3,420 m³</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">API Gravity:</span>
            <span className="font-semibold text-slate-200">11.2° Heavy Bitumen</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative w-full h-[660px] sm:h-[740px] rounded-2xl overflow-hidden border border-cyan-500/50 bg-[#020710] shadow-2xl shadow-cyan-950/60 select-none flex flex-col font-mono">
      {/* 3D HUD OVERLAY TOP TOOLBAR */}
      <div
        onMouseEnter={() => {
          setHoveredAsset(null);
          setHoveredPinTag(null);
        }}
        className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none"
      >
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Camera Presets Bar */}
          <div className="p-1 rounded-xl bg-slate-950/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-1 text-xs shadow-xl">
            <span className="text-cyan-400 text-[10px] font-bold uppercase px-2 flex items-center gap-1">
              <Camera className="w-3 h-3" /> CAM:
            </span>
            <button
              onClick={() => applyCameraPreset('schematic')}
              className={`px-2.5 py-1 rounded-lg transition-all font-bold uppercase text-[11px] flex items-center gap-1 ${
                activeCamPreset === 'schematic'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>📐 2D-Aligned 3D</span>
            </button>
            <button
              onClick={() => applyCameraPreset('orbit')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold uppercase text-[11px] ${
                activeCamPreset === 'orbit'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Orbit
            </button>
            <button
              onClick={() => applyCameraPreset('boiler')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold uppercase text-[11px] ${
                activeCamPreset === 'boiler'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔥 Boiler
            </button>
            <button
              onClick={() => applyCameraPreset('reservoir')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold uppercase text-[11px] ${
                activeCamPreset === 'reservoir'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌋 Reservoir
            </button>
            <button
              onClick={() => applyCameraPreset('pump')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold uppercase text-[11px] ${
                activeCamPreset === 'pump'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏗️ SRP Lift
            </button>
            <button
              onClick={() => applyCameraPreset('tank')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold uppercase text-[11px] ${
                activeCamPreset === 'tank'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛢️ Storage
            </button>
          </div>

          {/* Flow Speed & Play Controls */}
          <div className="p-1 rounded-xl bg-slate-950/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-1 text-xs shadow-xl">
            <button
              onClick={() => setIsFlowPlaying(!isFlowPlaying)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title={isFlowPlaying ? 'Pause Fluid Animation' : 'Play Fluid Animation'}
            >
              {isFlowPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            {([1.0, 2.0] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setFlowSpeedMultiplier(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  flowSpeedMultiplier === spd
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* 3-Way Label Display Mode Toggle */}
          <div className="p-1 rounded-xl bg-slate-950/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-1 text-xs shadow-xl">
            <span className="text-cyan-400 text-[10px] font-bold uppercase px-1.5 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Labels:
            </span>
            <button
              onClick={() => {
                setLabelMode('clean');
                setHoveredAsset(null);
                setHoveredPinTag(null);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                labelMode === 'clean'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="100% Unobstructed 3D view (no labels)"
            >
              ✨ Clean
            </button>
            <button
              onClick={() => setLabelMode('micro')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                labelMode === 'micro'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Compact micro-tags that expand on hover"
            >
              🔹 Micro
            </button>
            <button
              onClick={() => setLabelMode('detailed')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                labelMode === 'detailed'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show full telemetry cards on all assets"
            >
              📋 All
            </button>
          </div>
        </div>

        {/* Live Process Stream Badges */}
        <div className="flex items-center gap-2 pointer-events-auto text-[11px]">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md text-slate-200 flex items-center gap-2 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Steam Header ({isSimulatedMode ? `${metrics.steamPressure} bar` : '86.1 bar'})</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-500/40 backdrop-blur-md text-slate-200 flex items-center gap-2 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Crude Production (440.67 BPD)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-slate-200 flex items-center gap-2 shadow-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${isUnsafe ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{isUnsafe ? 'Caprock Rupture Hazard' : 'Reservoir Stimulated'}</span>
          </div>
        </div>
      </div>

      {/* THREE.JS CANVAS CONTAINER */}
      <div ref={containerRef} className="w-full flex-1 touch-none" />

      {/* 3D FLOATING HOLOGRAPHIC HUD CALLOUTS & UNIFIED INSPECTION CARDS */}
      {labelMode !== 'clean' && hudPins.map((pin) => {
        if (!pin.screenPos.visible) return null;
        const isSelected = selectedTag === pin.tag;
        const pinStatus = liveState?.assets[pin.tag]?.status || pin.status || 'NORMAL';
        const isWarn = pinStatus === 'CRITICAL' || pinStatus === 'WARNING' || (pin.tag === 'SP-02' && (isUnsafe || liveState?.assets['SP-02']?.status === 'WARNING'));
        const isHovered = hoveredPinTag === pin.tag || hoveredAsset === pin.tag;

        // Micro mode (when not hovered): sleek compact micro-pill
        if (labelMode === 'micro' && !isHovered) {
          return (
            <div
              key={pin.tag}
              onClick={() => onAssetClick(pin.tag)}
              onMouseEnter={() => setHoveredPinTag(pin.tag)}
              className="absolute z-10 cursor-pointer pointer-events-auto transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-125 select-none"
              style={{ left: `${pin.screenPos.x}px`, top: `${pin.screenPos.y}px` }}
            >
              <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400 shadow-cyan-500/40'
                  : isWarn
                  ? 'bg-rose-950/95 border-rose-500 text-rose-300 animate-pulse shadow-rose-900/40'
                  : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:border-cyan-400'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pin.color }}></span>
                <span>{pin.title}</span>
              </div>
              <div className="w-[1px] h-1.5 bg-gradient-to-b from-cyan-400 to-transparent mx-auto"></div>
            </div>
          );
        }

        // Detailed mode (when not hovered): clean 2-line mini summary card
        if (labelMode === 'detailed' && !isHovered) {
          return (
            <div
              key={pin.tag}
              onClick={() => onAssetClick(pin.tag)}
              onMouseEnter={() => setHoveredPinTag(pin.tag)}
              className="absolute z-10 cursor-pointer pointer-events-auto transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-105 select-none"
              style={{ left: `${pin.screenPos.x}px`, top: `${pin.screenPos.y}px` }}
            >
              <div className={`p-2 rounded-xl border backdrop-blur-md shadow-xl flex flex-col items-center text-center gap-0.5 transition-all min-w-[120px] ${
                isSelected
                  ? 'bg-cyan-950/95 border-cyan-400 text-white shadow-cyan-500/50 ring-2 ring-cyan-400'
                  : isWarn
                  ? 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-900/60 animate-pulse'
                  : 'bg-slate-950/85 border-slate-700/80 text-slate-200 hover:border-cyan-400'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pin.color }}></span>
                  <span className="font-extrabold text-white text-[11px] tracking-wider">{pin.title}</span>
                </div>
                <span className="text-[9px] text-cyan-300 font-semibold">{pin.subtitle}</span>
                <span className="text-[10px] font-bold text-amber-300 mt-0.5">{pin.metric}</span>
              </div>
              <div className="w-[1.5px] h-2.5 bg-gradient-to-b from-cyan-400 to-transparent mx-auto"></div>
            </div>
          );
        }

        // UNIFIED HOLOGRAPHIC INSPECTION CARD (Single Card on Hover - Eliminates Overlapping)
        return (
          <div
            key={pin.tag}
            onClick={() => onAssetClick(pin.tag)}
            onMouseEnter={() => setHoveredPinTag(pin.tag)}
            onMouseLeave={() => setHoveredPinTag(null)}
            className="absolute z-30 cursor-pointer pointer-events-auto transform -translate-x-1/2 -translate-y-full transition-all duration-150 select-none group"
            style={{ left: `${pin.screenPos.x}px`, top: `${pin.screenPos.y}px` }}
          >
            <div className={`p-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all min-w-[215px] max-w-[260px] ${
              isSelected
                ? 'bg-cyan-950/95 border-cyan-400 ring-2 ring-cyan-400 shadow-cyan-500/50'
                : isWarn
                ? 'bg-slate-950/95 border-rose-500 shadow-rose-950/70 ring-1 ring-rose-500/50'
                : 'bg-slate-950/95 border-cyan-500/70 shadow-cyan-950/80 ring-1 ring-cyan-500/30'
            }`}>
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: pin.color }}></span>
                  <span className="font-extrabold text-white text-xs tracking-wider">{pin.tag}</span>
                  <span className="text-[10px] text-cyan-300 font-medium">· {pin.subtitle}</span>
                </div>
                <StatusBadge status={pinStatus} size="sm" />
              </div>

              {/* Live Telemetry Key-Value Grid */}
              <div className="text-[10px] space-y-1 bg-slate-900/60 rounded-lg p-2 border border-slate-800/80">
                {renderPinTelemetry(pin.tag) || (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Reading:</span>
                    <span className="font-semibold text-amber-300">{pin.metric}</span>
                  </div>
                )}
              </div>

              {/* Action Callout */}
              <div className="text-[9px] text-cyan-400 pt-2 flex items-center justify-between border-t border-slate-800/80 font-bold mt-2 group-hover:text-cyan-300">
                <span>Click to open asset drawer</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Connecting Pin Needle with glowing optical tether anchor */}
            <div className="w-[1.5px] h-3.5 bg-gradient-to-b from-cyan-400 to-transparent mx-auto"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80 mx-auto -mt-0.5"></div>
          </div>
        );
      })}

      {/* FOOTER BAR */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none text-[11px] text-slate-400">
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md flex items-center gap-2.5 shadow-lg">
          <span>🖱️ <strong>Left-Drag:</strong> Orbit</span>
          <span>•</span>
          <span><strong>Right-Drag:</strong> Pan</span>
          <span>•</span>
          <span><strong>Scroll:</strong> Zoom</span>
          <span>•</span>
          <span><strong>Click Asset/Badge:</strong> Inspect Telemetry</span>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md text-cyan-300 font-bold flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Closed-Loop PFD Digital Twin 3D Engine • Active</span>
        </div>
      </div>
    </div>
  );
};
