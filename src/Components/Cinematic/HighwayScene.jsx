import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RoadStrips = () => {
    const meshRef = useRef();

    useFrame((state, delta) => {
        // Move road markings backward to simulate forward speed
        if (meshRef.current) {
            meshRef.current.position.z += delta * 20; // Speed
            if (meshRef.current.position.z > 10) {
                meshRef.current.position.z = 0; // Loop
            }
        }
    });

    return (
        <group ref={meshRef}>
            {/* Center broken lines */}
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh key={i} position={[0, 0.02, -i * 10]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.2, 4]} />
                    <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
                </mesh>
            ))}
        </group>
    );
}

const MovingLights = ({ count = 20, color = "#ff0000", xPos = -5, speed = 30 }) => {
    const mesh = useRef();
    const lightGeo = useMemo(() => new THREE.BoxGeometry(0.1, 0.1, 4), []);
    const lightMat = useMemo(() => new THREE.MeshBasicMaterial({ color: color }), [color]);

    // Initial random positions
    const initialPositions = useMemo(() => {
        return new Float32Array(count * 3).map(() => (Math.random() * 200) - 100);
    }, [count]);

    useFrame((state, delta) => {
        // We'd use InstancedMesh for true optimization, but for simplicity/editability in this prompt context:
        // We will just animate the parent group or individual children if needed.
        // For better performance in this specific setup, we'll just move the whole group and loop it?
        // Actually, let's just make a simple loop for a few lights.
    });

    return (
        <group>
            {Array.from({ length: count }).map((_, i) => (
                <MovingLightStrip key={i} zStart={-i * 20 - Math.random() * 10} x={xPos} speed={speed} color={color} />
            ))}
        </group>
    )
}

const MovingLightStrip = ({ zStart, x, speed, color }) => {
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.z += delta * speed;
            if (ref.current.position.z > 20) {
                ref.current.position.z = -200; // Reset far back
            }
        }
    });

    return (
        <mesh ref={ref} position={[x, 1, zStart]}>
            <boxGeometry args={[0.1, 0.1, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
    )
}


const HighwayScene = () => {
    return (
        <>
            {/* Environment Colors */}
            <color attach="background" args={['#050510']} />
            <fog attach="fog" args={['#050510', 10, 50]} />

            {/* Lights */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 10, 5]} intensity={1} castShadow />

            {/* The Road Surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]} receiveShadow>
                <planeGeometry args={[20, 400]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    roughness={0.4}
                    metalness={0.8}
                />
            </mesh>

            {/* Road Markings */}
            <RoadStrips />

            {/* Passing Lights (Simulating Speed) */}
            <MovingLights count={30} xPos={-6} color="#ff0000" speed={40} /> {/* Left - Tail lights passing? or oncoming? keeping simple red */}
            <MovingLights count={30} xPos={6} color="#ffffff" speed={60} />  {/* Right - Headlights */}

            {/* Ground Reflection Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#050510" roughness={0.1} metalness={0.9} />
            </mesh>
        </>
    );
};

export default HighwayScene;
