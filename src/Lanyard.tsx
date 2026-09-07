import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, extend, useFrame, type ThreeElement, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox, useTexture, Text } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

const createTextTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.direction = 'ltr';
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, 1024, 128);
    context.fillStyle = '#10b981'; // sedikit hijau khas console/code
    context.font = 'bold 60px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('< / >   D E V E L O P E R   { }', 512, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.rotation = 0;
  texture.repeat.set(4, 1);
  texture.offset.set(0, 0);
  texture.needsUpdate = true;
  return texture;
};

export default function Lanyard() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 20 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={Math.PI} />
      <Physics gravity={[0, -20, 0]} timeStep={1 / 60}>
        <Band isMobile={isMobile} />
      </Physics>
      <Environment blur={0.75}>
        <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
      </Environment>
    </Canvas>
  );
}

function Band({ isMobile = false }: { isMobile?: boolean }) {
  const lanyardTexture = useMemo(() => createTextTexture(), []);
  const bandLeft = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>, InstanceType<typeof MeshLineMaterial>>>(null!);
  const bandRight = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>, InstanceType<typeof MeshLineMaterial>>>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody & { lerped?: THREE.Vector3 }>(null!);
  const j2 = useRef<RapierRigidBody & { lerped?: THREE.Vector3 }>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const maxSpeed = 50, minSpeed = 0;

  const segmentProps: RigidBodyProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  const getLerped = (body: RapierRigidBody & { lerped?: THREE.Vector3 }) => {
    if (!body.lerped) {
      body.lerped = new THREE.Vector3().copy(body.translation());
    }
    return body.lerped;
  };

  const texture = useTexture('/fotokartun2.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  
  const [curveLeft] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [curveRight] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 0.6]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.6]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.6]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.7, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => { document.body.style.cursor = 'auto'; };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean' && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }
    if (fixed.current && j1.current && j2.current && j3.current && card.current && bandLeft.current && bandRight.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current) return;
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(0.1, Math.min(1, lerped.distanceTo(ref.current.translation())));
        lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      
      const j3Pos = j3.current.translation();
      const j2Pos = getLerped(j2.current);
      const j1Pos = getLerped(j1.current);
      const fixedPos = fixed.current.translation();

      // Tali Kiri
      curveLeft.points[0].copy(j3Pos);
      curveLeft.points[1].set(j2Pos.x - 0.5, j2Pos.y, j2Pos.z);
      curveLeft.points[2].set(j1Pos.x - 1.0, j1Pos.y, j1Pos.z);
      curveLeft.points[3].set(fixedPos.x - 1.5, fixedPos.y, fixedPos.z);
      bandLeft.current.geometry.setPoints(curveLeft.getPoints(isMobile ? 16 : 32));

      // Tali Kanan
      curveRight.points[0].copy(j3Pos);
      curveRight.points[1].set(j2Pos.x + 0.5, j2Pos.y, j2Pos.z);
      curveRight.points[2].set(j1Pos.x + 1.0, j1Pos.y, j1Pos.z);
      curveRight.points[3].set(fixedPos.x + 1.5, fixedPos.y, fixedPos.z);
      bandRight.current.geometry.setPoints(curveRight.getPoints(isMobile ? 16 : 32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  curveLeft.curveType = 'chordal';
  curveRight.curveType = 'chordal';

  return (
    <>
      <group position={[0, 5.3, 0]}>
        <RigidBody position={[0, 0, 0]} ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0, -0.6, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} mass={1} />
        </RigidBody>
        <RigidBody position={[0, -1.2, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} mass={1} />
        </RigidBody>
        <RigidBody position={[0, -1.8, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} mass={1} />
        </RigidBody>
        
        <RigidBody
          position={[0, -3.8, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[1.3, 1.6, 0.05]} mass={1} />
          
          <group
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: ThreeEvent<PointerEvent>) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              if (card.current) {
                (e.target as Element).setPointerCapture(e.pointerId);
                drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
              }
            }}
          >
            {/* Custom 3D Card Geometry */}
            <RoundedBox args={[2.6, 3.2, 0.1]} radius={0.1} smoothness={4}>
              <meshPhysicalMaterial 
                color="rgba(15, 23, 42, 0.8)" 
                transmission={0.5} 
                opacity={1} 
                roughness={0.2} 
                thickness={1} 
              />
            </RoundedBox>
            
            {/* Profile Image mapped to a plane on the card front */}
            <mesh position={[0, 0.5, 0.06]}>
              <planeGeometry args={[1.5, 1.5]} />
              <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
            </mesh>

            {/* Name Text */}
            <Text position={[0, -0.7, 0.06]} fontSize={0.3} color="white" fontWeight="bold" anchorX="center" anchorY="middle">
              Zulfahmi
            </Text>
            <Text position={[0, -1.05, 0.06]} fontSize={0.13} color="#94a3b8" anchorX="center" anchorY="middle">
              Software Developer | Tech Enthusiast
            </Text>

            {/* Developer logo */}
            <Text position={[-0.92, 1.25, 0.06]} fontSize={0.2} color="#10b981" fontWeight="bold" anchorX="center" anchorY="middle">
              &lt;/&gt;
            </Text>
            
            {/* Simple Clip at top */}
            <mesh position={[0, 1.7, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.4]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      
      <mesh ref={bandLeft} position={[0, 0, -0.15]} renderOrder={-1}>
        <meshLineGeometry />
        {/* @ts-expect-error: args is not required at runtime */}
        <meshLineMaterial
          color="white"
          map={lanyardTexture}
          useMap={1}
          depthTest={true}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          lineWidth={1}
        />
      </mesh>
      <mesh ref={bandRight} position={[0, 0, -0.15]} renderOrder={-1}>
        <meshLineGeometry />
        {/* @ts-expect-error: args is not required at runtime */}
        <meshLineMaterial
          color="white"
          map={lanyardTexture}
          useMap={1}
          depthTest={true}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
