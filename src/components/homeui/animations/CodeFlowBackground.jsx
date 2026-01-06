'use client';

import React, { useEffect, useRef } from 'react';

const polyglotSnippets = [
    // Kotlin
    'val ktor = HttpClient(CIO)', 'suspend fun main() {', 'routing { get(\"/\") }',
    // C / Systems
    '#include <vulkan.h>', 'int main(int argc, char** argv)', 'malloc(sizeof(struct))', 'data << 8 | data >> 24',
    // Flutter
    'Widget build(BuildContext context)', 'MaterialApp(home: Pixel())', 'AnimatedContainer(duration: 1s)',
    // C#
    'public partial class MainPage : ContentPage', 'await Shell.Current.GoToAsync()',
    // Rust
    '#[tokio::main] async fn main()', 'use reqwest::Client;', 'Result<(), Box<dyn Error>>',
    // Go
    'go func() { messages <- \"hi\" }()', 'msg := <-messages', 'http.ListenAndServe(\":8080\")',
    // Python / AI
    'import torch', 'model = transformer.load()', 'optimizer.step()'
];

const colors = [
    '#00FFFF', // Cyan
    '#FF1493', // Pink
    '#C084FC', // Purple
    '#7DD3FC', // Sky
    '#5EEAD4', // Teal
    '#FDBA74', // Orange
];

const CodeFlowBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();

        const fontSize = 12;
        const columns = Math.floor(canvas.width / 15); // Denser columns
        const drops = new Array(columns).fill(0).map(() => Math.random() * -canvas.height);

        const columnData = new Array(columns).fill(0).map(() => ({
            snippet: polyglotSnippets[Math.floor(Math.random() * polyglotSnippets.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: 5 + Math.random() * 20, // Varied speeds
            layer: Math.random() > 0.5 ? 'foreground' : 'background'
        }));

        const draw = () => {
            ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

            for (let i = 0; i < drops.length; i++) {
                const { snippet, color, speed, layer } = columnData[i];

                const baseOpacity = layer === 'foreground' ? 0.3 : 0.1;
                const opacity = Math.min(baseOpacity, Math.max(0.05, baseOpacity - (drops[i] / canvas.height) * 0.2));
                ctx.fillStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');

                const char = snippet[Math.floor(Date.now() / 100) % snippet.length];
                ctx.fillText(char, i * 15, drops[i]);

                if (drops[i] > canvas.height && Math.random() > 0.985) {
                    drops[i] = 0;
                    columnData[i] = {
                        snippet: polyglotSnippets[Math.floor(Math.random() * polyglotSnippets.length)],
                        color: colors[Math.floor(Math.random() * colors.length)],
                        speed: 5 + Math.random() * 20,
                        layer: Math.random() > 0.5 ? 'foreground' : 'background'
                    };
                }

                drops[i] += speed;
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleResize = () => setCanvasSize();

        window.addEventListener('resize', handleResize);
        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -2,
                pointerEvents: 'none',
                opacity: 0.2
            }}
        />
    );
};

export default CodeFlowBackground;
