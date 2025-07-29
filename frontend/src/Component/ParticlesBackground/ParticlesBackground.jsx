import { Particles } from 'react-tsparticles'
import { useCallback } from 'react'
import { loadSlim } from 'tsparticles-slim'

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine) // ✅ NO usa loadFull ni checkVersion
  }, [])

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: true, zIndex: -1 },
        background: { color: '#000000' },
        fpsLimit: 60,
        particles: {
            number: {
            value: 60,
            density: { enable: true, area: 800 }
            },
            color: { value: ['#ff4500', '#ff6347', '#ffa07a'] },
            shape: { type: 'circle' },
            opacity: {
            value: 0.7,
            random: true
            },
            size: {
            value: { min: 1, max: 4 },
            random: true
            },
            move: {
            enable: true,
            speed: 1.2,
            direction: 'top',
            outModes: { default: 'out' }
            }
        }
        }}
    />
  )
}

export default ParticlesBackground
