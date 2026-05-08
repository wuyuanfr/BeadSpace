import * as PIXI from "pixi.js";

const PARTICLE_COLORS = [0xece7df, 0xd7c3f1, 0xa8d5ba, 0xf3d19c, 0xffb7b2, 0x9bc7f7];

export function createAmbientParticles(
  width: number,
  height: number,
  count = 40
): PIXI.Container {
  const container = new PIXI.Container();

  for (let i = 0; i < count; i++) {
    const size = 2 + Math.random() * 4;
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

    const p = new PIXI.Graphics() as PIXI.Graphics & {
      _vy: number;
      _vx: number;
      _baseAlpha: number;
    };
    p.circle(0, 0, size);
    p.fill({ color, alpha: 0.4 });
    p.x = Math.random() * width;
    p.y = Math.random() * height;
    p._vy = 0.1 + Math.random() * 0.3;
    p._vx = (Math.random() - 0.5) * 0.2;
    p._baseAlpha = 0.15 + Math.random() * 0.25;
    p.alpha = p._baseAlpha;

    container.addChild(p);
  }

  return container;
}
