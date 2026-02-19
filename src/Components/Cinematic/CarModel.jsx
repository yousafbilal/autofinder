import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const CarModel = () => {
    const meshRef = useRef();

    // Subtle idle animation
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.position.y = Math.sin(t * 2) * 0.05 + 0.5; // Hover/Suspension effect
            meshRef.current.rotation.z = Math.sin(t * 2) * 0.01; // Slight roll
        }
    });

    return (
        <group ref={meshRef} position={[0, 0.5, 0]}>
            {/* Car Body - Futuristic Low Poly Shape */}
            <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
                <boxGeometry args={[2, 0.5, 4.5]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} envMapIntensity={1} />
            </mesh>

            {/* Cabin / Windows */}
            <mesh position={[0, 0.9, -0.2]}>
                <boxGeometry args={[1.8, 0.6, 2.5]} />
                <meshStandardMaterial color="#000" metalness={1} roughness={0} opacity={0.9} transparent />
            </mesh>

            {/* Headlights (Emissive glowing strips) */}
            <mesh position={[0, 0.4, 2.26]}>
                <boxGeometry args={[1.9, 0.1, 0.1]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} toneMapped={false} />
            </mesh>

            {/* Taillights */}
            <mesh position={[0, 0.4, -2.26]}>
                <boxGeometry args={[1.9, 0.1, 0.1]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={5} toneMapped={false} />
            </mesh>

            {/* Wheels */}
            <mesh position={[0.9, 0, 1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-0.9, 0, 1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.9, 0, -1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-0.9, 0, -1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    );
};

export default CarModel;
