'use client';

import React, { useRef, useEffect, Suspense } from 'react';
import { Box } from '@mui/material';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    useGLTF,
    useAnimations,
    Float,
    Environment,
    ContactShadows,
    PresentationControls,
    Stage,
    PerspectiveCamera
} from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';

const BOT_URL = '/model/sphere_bot.glb';

function BotModel({ hover }) {
    const group = useRef();
    const { scene, animations } = useGLTF(BOT_URL);
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (actions) {
            const firstAnim = Object.keys(actions)[0] || Object.keys(actions).find(k => k.toLowerCase().includes('idle'));
            if (firstAnim && actions[firstAnim]) {
                actions[firstAnim].reset().fadeIn(0.5).play();
            }
        }
    }, [actions]);

    useFrame((state) => {
        if (group.current) {
            // Smooth idle sway
            group.current.rotation.y += 0.003;
            if (!hover) {
                group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
            }
        }
    });

    return (
        <primitive
            ref={group}
            object={scene}
            scale={1.5}
            rotation={[0, -Math.PI / 4, 0]}
        />
    );
}

const SphereBot = ({ hover = false, style = {} }) => {
    return (
        <Box sx={{ width: '100%', height: '100%', cursor: 'grab', '&:active': { cursor: 'grabbing' }, ...style }}>
            <Canvas
                shadows
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={35} />

                    {/* Stage provides studio-quality auto-lighting and shadows */}
                    <Stage intensity={0.6} environment="city" shadows={{ type: 'contact', opacity: 0.2, blur: 2.5 }} adjustCamera={false}>
                        <PresentationControls
                            global
                            config={{ mass: 2, tension: 500 }}
                            snap={{ mass: 4, tension: 1500 }}
                            rotation={[0, 0.3, 0]}
                            polar={[-Math.PI / 3, Math.PI / 3]}
                            azimuth={[-Math.PI / 1.5, Math.PI / 1.5]}
                        >
                            <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.8}>
                                <BotModel hover={hover} />
                            </Float>
                        </PresentationControls>
                    </Stage>

                    {/* High-end post-processing */}
                    <EffectComposer multisampling={4}>
                        <Bloom
                            luminanceThreshold={0.5}
                            mipmapBlur
                            intensity={0.4}
                            radius={0.3}
                        />
                        <Noise opacity={0.02} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </Box>
    );
};

export default SphereBot;

// Preload for zero-lag entry
useGLTF.preload(BOT_URL);
