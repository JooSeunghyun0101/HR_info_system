import React, { useEffect, useRef } from 'react';

interface Particle {
    angle: number;           // 마우스로부터의 각도
    distance: number;        // 마우스로부터의 거리
    x: number;
    y: number;
    targetX: number;         // 목표 위치
    targetY: number;
    size: number;
    color: string;
    layer: number;
    phase: number;           // 일렁임 위상
    waveSpeed: number;       // 일렁임 속도
    waveAmplitude: number;   // 일렁임 진폭
    offsetFromBorder: number; // 카드 경계로부터의 거리 오프셋 (두께감)
    posNoise: number;        // 위치 노이즈 (정확한 패턴 방지)
}

const ParticleBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const animationFrameRef = useRef<number | undefined>(undefined);
    const timeRef = useRef(0);
    const attractTargetRef = useRef<{
        x: number;
        y: number;
        left: number;
        top: number;
        width: number;
        height: number;
        cardId: string;
        active: boolean
    }>({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        cardId: '',
        active: false
    });
    const forceResetRef = useRef(false);
    const resetStartTimeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvas 크기 설정
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            mouseRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 파티클 초기화 (마우스 중심 원형 배치)
        const initParticles = () => {
            const particles: Particle[] = [];
            const colors = ['#C05621', '#F59E0B', '#FFB800']; // Bronze -> Amber -> Gold
            const starColors = ['#FFFFFF', '#E0F2FE', '#FECACA', '#3B82F6', '#991B1B']; // White, Light Blue, Pale Red, Royal Blue, Dark Red

            const layers = [
                { size: [0.8, 1.2], distance: [300, 500] },   // 뒤 레이어: 작고 멀리
                { size: [1.0, 1.5], distance: [200, 400] },   // 중간 레이어
                { size: [1.2, 2.0], distance: [250, 450] },   // 앞 레이어: 크고 중간
            ];

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (let i = 0; i < 3; i++) {
                const particleCount = 100;
                for (let j = 0; j < particleCount; j++) {
                    const angle = (j / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                    const distRange = layers[i].distance;
                    const distance = distRange[0] + Math.random() * (distRange[1] - distRange[0]);

                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;

                    const sizeRange = layers[i].size;
                    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);

                    // 5% 확률로 별 색상 사용
                    const isStar = Math.random() < 0.05;
                    const color = isStar
                        ? starColors[Math.floor(Math.random() * starColors.length)]
                        : colors[i];

                    particles.push({
                        angle,
                        distance,
                        x,
                        y,
                        targetX: x,
                        targetY: y,
                        size,
                        color: color,
                        layer: i,
                        phase: Math.random() * Math.PI * 2,
                        waveSpeed: 0.5 + Math.random() * 0.5,
                        waveAmplitude: 3 + Math.random() * 5,
                        offsetFromBorder: (Math.random() - 0.5) * 60, // +/- 30px 범위로 퍼짐
                        posNoise: (Math.random() - 0.5) * 0.15,       // 위치 비율에 약간의 노이즈
                    });
                }
            }
            // 파티클 섞기 (크기/레이어가 골고루 분포되도록)
            for (let i = particles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [particles[i], particles[j]] = [particles[j], particles[i]];
            }
            particlesRef.current = particles;
        };
        initParticles();

        // 마우스 추적
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // 카드 attract 이벤트 리스너
        const handleCardAttract = (e: Event) => {
            const detail = (e as CustomEvent).detail;

            // 카드가 바뀌거나 활성화될 때 강제 리셋 트리거
            if (detail.active && detail.cardId !== attractTargetRef.current.cardId) {
                forceResetRef.current = true;
                resetStartTimeRef.current = Date.now();
            }

            attractTargetRef.current = {
                x: detail.x,
                y: detail.y,
                left: detail.left || 0,
                top: detail.top || 0,
                width: detail.width || 0,
                height: detail.height || 0,
                cardId: detail.cardId || '',
                active: detail.active
            };
        };
        window.addEventListener('cardAttract', handleCardAttract);

        // 애니메이션 루프
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            timeRef.current += 0.01; // 속도 조절
            const mouse = mouseRef.current;
            const particles = particlesRef.current;

            // 화면 중앙 고정
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            particles.forEach((particle, index) => {
                const attractTarget = attractTargetRef.current;

                let targetX: number;
                let targetY: number;
                let easing: number;

                // 카드에 끌리는 효과
                if (attractTarget.active) {
                    const horizontalOffset = attractTarget.cardId === 'manual' ? 9 : 5;
                    const verticalOffset = 0;

                    const cardLeft = attractTarget.left + horizontalOffset;
                    const cardRight = attractTarget.left + attractTarget.width + horizontalOffset;
                    const cardTop = attractTarget.top + verticalOffset;
                    const cardBottom = attractTarget.top + attractTarget.height + verticalOffset;

                    const totalParticles = particles.length;
                    const perimeter = 2 * (attractTarget.width + attractTarget.height);

                    const topParticleCount = Math.round(totalParticles * (attractTarget.width / perimeter));
                    const rightParticleCount = Math.round(totalParticles * (attractTarget.height / perimeter));
                    const bottomParticleCount = Math.round(totalParticles * (attractTarget.width / perimeter));
                    const leftParticleCount = totalParticles - topParticleCount - rightParticleCount - bottomParticleCount;

                    let posX: number;
                    let posY: number;
                    let sideIndex: number;
                    let positionInSide: number;
                    let particlesInCurrentSide: number;

                    if (index < topParticleCount) {
                        sideIndex = 0; // 상단
                        positionInSide = index;
                        particlesInCurrentSide = topParticleCount;
                    } else if (index < topParticleCount + rightParticleCount) {
                        sideIndex = 1; // 우측
                        positionInSide = index - topParticleCount;
                        particlesInCurrentSide = rightParticleCount;
                    } else if (index < topParticleCount + rightParticleCount + bottomParticleCount) {
                        sideIndex = 2; // 하단
                        positionInSide = index - topParticleCount - rightParticleCount;
                        particlesInCurrentSide = bottomParticleCount;
                    } else {
                        sideIndex = 3; // 좌측
                        positionInSide = index - topParticleCount - rightParticleCount - bottomParticleCount;
                        particlesInCurrentSide = leftParticleCount;
                    }

                    // 각 면에서의 비율 계산 (코너 겹침 방지) + 노이즈 추가
                    let ratio = particlesInCurrentSide > 1 ? positionInSide / particlesInCurrentSide : 0;
                    ratio += particle.posNoise; // 위치 랜덤성 추가

                    // 전체적인 일렁임 (Global Wave)
                    const waveFrequency = 8;
                    const waveSpeed = 1.5;
                    const globalWave = Math.sin(ratio * Math.PI * waveFrequency + timeRef.current * waveSpeed) * 5;

                    switch (sideIndex) {
                        case 0: // 상단
                            posX = cardLeft + ratio * attractTarget.width;
                            posY = cardTop;
                            posY += particle.offsetFromBorder;
                            posY += globalWave;
                            break;
                        case 1: // 우측
                            posX = cardRight;
                            posY = cardTop + ratio * attractTarget.height;
                            posX += particle.offsetFromBorder;
                            posX += globalWave;
                            break;
                        case 2: // 하단
                            posX = cardRight - ratio * attractTarget.width;
                            posY = cardBottom;
                            posY += particle.offsetFromBorder;
                            posY += globalWave;
                            break;
                        case 3: // 좌측
                        default:
                            posX = cardLeft;
                            posY = cardBottom - ratio * attractTarget.height;
                            posX += particle.offsetFromBorder;
                            posX += globalWave;
                            break;
                    }

                    targetX = posX;
                    targetY = posY;
                    easing = 0.08;
                } else {
                    // 기본: 중앙 고정 원형 배치 (또는 강제 리셋 중)
                    const baseX = centerX + Math.cos(particle.angle) * particle.distance;
                    const baseY = centerY + Math.sin(particle.angle) * particle.distance;

                    // 일렁이는 효과 (sine wave)
                    const wave = Math.sin(timeRef.current * particle.waveSpeed + particle.phase) * particle.waveAmplitude;
                    const waveX = Math.cos(particle.angle + Math.PI / 2) * wave;
                    const waveY = Math.sin(particle.angle + Math.PI / 2) * wave;

                    targetX = baseX + waveX;
                    targetY = baseY + waveY;

                    // 마우스 근처에서만 약간 반응
                    {
                        const dx = mouse.x - targetX;
                        const dy = mouse.y - targetY;
                        const distanceToMouse = Math.sqrt(dx * dx + dy * dy);
                        const interactionRadius = 250;

                        if (distanceToMouse < interactionRadius) {
                            const force = (interactionRadius - distanceToMouse) / interactionRadius;
                            const angle = Math.atan2(dy, dx);

                            const pushStrength = force * 15;
                            const pushX = -Math.cos(angle) * pushStrength;
                            const pushY = -Math.sin(angle) * pushStrength;

                            targetX += pushX;
                            targetY += pushY;
                        }
                    }

                    // 리셋 중이거나 비활성 상태일 때는 더 빠르게 복귀
                    easing = !attractTarget.active ? 0.08 : 0.08;
                }

                particle.targetX = targetX;
                particle.targetY = targetY;
                particle.x += (particle.targetX - particle.x) * easing;
                particle.y += (particle.targetY - particle.y) * easing;

                // 각도도 천천히 변화 (시간차 효과)
                particle.angle += Math.sin(timeRef.current * 0.3 + particle.phase) * 0.001;

                // 파티클 그리기
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

                // opacity는 레이어에 따라
                const opacities = [0.4, 0.6, 0.8];
                const opacity = opacities[particle.layer];

                ctx.fillStyle = particle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
                ctx.fill();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animate();

        // 클린업
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('cardAttract', handleCardAttract);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
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
                pointerEvents: 'none',
                zIndex: 1,
            }}
        />
    );
};

export default ParticleBackground;
