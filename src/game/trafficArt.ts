import { Container, Graphics } from 'pixi.js';

const ink = 0x352c46;
const cream = 0xf6e5c5;
const teal = 0x66a99d;
const coral = 0xe98476;

/** Static 720-square board. Dynamic queues, lights, closures and HUD belong to the scene. */
export function drawTrafficBoard(): Container {
    const board = new Container();
    const g = new Graphics();
    board.addChild(g);
    g.rect(0, 0, 720, 720).fill(0xbcd2bb);
    // Slightly raised blocks frame the playable road, without covering its approaches.
    for (const [x, y] of [[0, 0], [478, 0], [0, 478], [478, 478]]) {
        g.roundRect(x + 9, y + 9, 224, 224, 20).fill(0x9ab4a4);
        g.roundRect(x, y, 232, 232, 18).fill(cream);
        g.roundRect(x + 13, y + 13, 206, 206, 13).stroke({ color: 0xdacbaa, width: 2 });
    }
    g.rect(245, 0, 230, 720).fill(0x716879);
    g.rect(0, 245, 720, 230).fill(0x716879);
    g.rect(260, 0, 200, 720).fill(ink);
    g.rect(0, 260, 720, 200).fill(ink);
    // Cream borders preserve the exact asphalt contract: [260,460] on both axes.
    for (const [x, y, w, h] of [[254, 0, 4, 245], [462, 0, 4, 245], [254, 475, 4, 245], [462, 475, 4, 245], [0, 254, 245, 4], [475, 254, 245, 4], [0, 462, 245, 4], [475, 462, 245, 4]]) {
        g.rect(x, y, w, h).fill(cream);
    }
    for (let p = 10; p < 230; p += 38) {
        g.roundRect(358, p, 4, 19, 2).fill(0x9b8496);
        g.roundRect(358, 720 - p - 19, 4, 19, 2).fill(0x9b8496);
        g.roundRect(p, 358, 19, 4, 2).fill(0x9b8496);
        g.roundRect(720 - p - 19, 358, 19, 4, 2).fill(0x9b8496);
    }
    // Incoming stop bars only. They are scenery, never a signal that releasing is safe.
    g.rect(298, 235, 52, 6).fill(cream);
    g.rect(372, 479, 52, 6).fill(cream);
    g.rect(479, 302, 6, 52).fill(cream);
    g.rect(235, 368, 6, 52).fill(cream);
    // Inbound arrows align with north x330, south x390, east y330, west y390.
    const arrow = (x: number, y: number, angle: number) => {
        const a = new Graphics().poly([-3, 15, 3, 15, 3, -2, 11, -2, 0, -14, -11, -2, -3, -2]).fill(0xb29caa);
        a.position.set(x, y);
        a.rotation = angle;
        board.addChild(a);
    };
    arrow(330, 188, Math.PI);
    arrow(390, 532, 0);
    arrow(532, 330, -Math.PI / 2);
    arrow(188, 390, Math.PI / 2);
    // Small authored city diorama, kept away from the central conflict area.
    const building = (x: number, y: number, w: number, h: number, color: number) => {
        g.roundRect(x + 8, y + 10, w, h, 10).fill(0xb4ac97);
        g.roundRect(x, y, w, h, 9).fill(ink);
        g.roundRect(x + 4, y + 4, w - 8, h - 13, 6).fill(color);
        g.roundRect(x + 17, y + 17, w - 34, h - 42, 4).fill(cream);
        g.rect(x + 22, y + 22, w - 44, 5).fill({ color: ink, alpha: 0.17 });
        g.roundRect(x + w - 32, y + 12, 18, 18, 3).fill(ink);
        g.roundRect(x + w - 29, y + 15, 12, 12, 2).fill(teal);
    };
    building(28, 30, 154, 109, coral);
    building(514, 48, 147, 126, teal);
    building(35, 536, 151, 137, teal);
    building(526, 561, 157, 105, coral);
    const tree = (x: number, y: number) => {
        g.ellipse(x + 5, y + 9, 22, 17).fill(0xa7b69c);
        g.circle(x, y, 20).fill(ink);
        g.circle(x - 2, y - 3, 17).fill(0x529689);
        g.circle(x - 6, y - 8, 7).fill(0x8ac0a1);
    };
    tree(194, 182); tree(42, 184); tree(678, 208);
    tree(505, 199); tree(208, 506); tree(41, 503); tree(499, 682);
    // A single neglected cone, visual personality without fake live hazards.
    g.ellipse(684, 507, 12, 5).fill(ink);
    g.poly([676, 505, 683, 484, 690, 505]).fill(coral);
    g.rect(679, 495, 8, 4).fill(cream);
    board.eventMode = 'none';
    return board;
}

/** Centered at (0,0), pointing up. Scene applies travel rotation and position. */
export function drawVehicle(kind: 'car' | 'truck' | 'ambulance', color: number): Container {
    const vehicle = new Container();
    const g = new Graphics();
    vehicle.addChild(g);
    const length = kind === 'truck' ? 68 : 44;
    const width = 26;
    const half = length / 2;
    const body = kind === 'ambulance' ? cream : color;
    g.roundRect(-width / 2 + 3, -half + 4, width, length, 6).fill({ color: 0x130e22, alpha: 0.35 });
    for (const y of [-half + 8, half - 16]) {
        g.roundRect(-width / 2 - 3, y, 7, 10, 2).fill(0x211c2e);
        g.roundRect(width / 2 - 4, y, 7, 10, 2).fill(0x211c2e);
    }
    g.roundRect(-width / 2, -half, width, length, 6).fill(ink);
    g.roundRect(-width / 2 + 2, -half + 2, width - 4, length - 4, 5).fill(body);
    g.roundRect(-width / 2 + 5, -half + 8, width - 10, 10, 3).fill(ink);
    g.rect(-width / 2 + 7, -half + 9, width - 14, 3).fill(teal);
    g.roundRect(-width / 2 + 3, -half + 2, 6, 4, 1).fill(cream);
    g.roundRect(width / 2 - 9, -half + 2, 6, 4, 1).fill(cream);
    if (kind === 'truck') {
        g.roundRect(-width / 2 + 1, -half + 23, width - 2, length - 24, 3).fill(ink);
        g.roundRect(-width / 2 + 3, -half + 25, width - 6, length - 28, 2).fill(0xe2c79f);
        for (let y = -half + 30; y < half - 4; y += 8) {
            g.rect(-width / 2 + 5, y, width - 10, 2).fill(0xc1a488);
        }
    } else if (kind === 'ambulance') {
        g.rect(-11, -5, 22, 5).fill(ink);
        g.rect(-10, -5, 9, 4).fill(coral);
        g.rect(1, -5, 9, 4).fill(0x8bbbd4);
        // Teal medical plus is readable without relying on a red-cross emblem.
        g.rect(-3, 4, 6, 12).fill(0x287f7b);
        g.rect(-7, 7, 14, 6).fill(0x287f7b);
    } else {
        g.roundRect(-9, -1, 18, 15, 3).fill({ color: cream, alpha: 0.35 });
        g.roundRect(-9, 13, 18, 5, 2).fill(ink);
    }
    g.rect(-width / 2 + 3, half - 5, 5, 3).fill(coral);
    g.rect(width / 2 - 8, half - 5, 5, 3).fill(coral);
    vehicle.eventMode = 'none';
    return vehicle;
}