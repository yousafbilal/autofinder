import React, { Suspense, useRef, useLayoutEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll, Environment, ContactShadows } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HighwayScene from './HighwayScene';
import CarModel from './CarModel';
import ContentOverlay from './ContentOverlay';

gsap.registerPlugin(ScrollTrigger);

const CameraController = () => {
    const { camera, scene } = useThree();
    const scroll = useScroll();
    const tl = useRef();

    useFrame(() => {
        // Basic camera sway or follow
        // For scroll-driven, we can use scroll.offset
        // camera.position.z = 5 - scroll.offset * 10;
    });

    useLayoutEffect(() => {
        tl.current = gsap.timeline({
            scrollTrigger: {
                trigger: "#cinematic-container",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            }
        });

        // Example GSAP animation linked to scroll
        // tl.current.to(camera.position, { z: -5, duration: 1 }, 0);
    }, []);

    return null;
}

const CinematicView = () => {
    return (
        <div id="cinematic-container" className="relative w-full h-[500vh] bg-black">
            {/* 3D Scene - Fixed Background */}
            <div className="fixed inset-0 z-0">
                <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
                    <Suspense fallback={null}>
                        {/* Scene Content */}
                        <HighwayScene />
                        <CarModel />

                        {/* Lighting & Environment */}
                        <Environment preset="night" />
                        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />

                        {/* Controls */}
                        <ScrollControls pages={5} damping={0.3}>
                            {/* We can use <Scroll> html here if we want 3D-tied HTML, 
                               but for this request, we want "Content Overlay" separately controlled or tied */}
                            <CameraController />
                        </ScrollControls>
                    </Suspense>
                </Canvas>
            </div>

            {/* Content Overlay - handling the text cards */}
            <ContentOverlay />
        </div>
    );
};

export default CinematicView;
