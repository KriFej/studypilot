export interface WeaponDef {
  name: string;
  damage: number;
  rpm: number;
  magSize: number;
  reloadTime: number;
  spread: number;
  recoilX: number;
  recoilY: number;
  range: number;
  auto: boolean;
  zoomFov: number;
}

export const WEAPONS: Record<string, WeaponDef> = {
  ar: {
    name: 'ASSAULT RIFLE',
    damage: 25,
    rpm: 600,
    magSize: 30,
    reloadTime: 2.2,
    spread: 0.025,
    recoilX: 0.015,
    recoilY: 0.04,
    range: 200,
    auto: true,
    zoomFov: 70,
  },
  pistol: {
    name: 'PISTOL',
    damage: 35,
    rpm: 350,
    magSize: 12,
    reloadTime: 1.4,
    spread: 0.015,
    recoilX: 0.02,
    recoilY: 0.06,
    range: 100,
    auto: false,
    zoomFov: 75,
  },
  sniper: {
    name: 'SNIPER',
    damage: 90,
    rpm: 60,
    magSize: 5,
    reloadTime: 3.0,
    spread: 0.002,
    recoilX: 0.01,
    recoilY: 0.12,
    range: 600,
    auto: false,
    zoomFov: 25,
  },
};

export class WeaponState {
  def: WeaponDef;
  ammo: number;
  reserve: number;
  reloading = false;
  reloadTimer = 0;
  fireTimer = 0;
  recoilX = 0;
  recoilY = 0;

  constructor(def: WeaponDef, reserve = 120) {
    this.def = def;
    this.ammo = def.magSize;
    this.reserve = reserve;
  }

  canFire(): boolean {
    return !this.reloading && this.ammo > 0 && this.fireTimer <= 0;
  }

  fire(): boolean {
    if (!this.canFire()) return false;
    this.ammo--;
    this.fireTimer = 60 / this.def.rpm;
    this.recoilX += (Math.random() - 0.5) * this.def.recoilX * 2;
    this.recoilY += this.def.recoilY;
    return true;
  }

  startReload(): boolean {
    if (this.reloading || this.ammo === this.def.magSize || this.reserve <= 0) return false;
    this.reloading = true;
    this.reloadTimer = this.def.reloadTime;
    return true;
  }

  update(dt: number) {
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.recoilX *= Math.pow(0.05, dt);
    this.recoilY *= Math.pow(0.1, dt);

    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const needed = this.def.magSize - this.ammo;
        const take = Math.min(needed, this.reserve);
        this.ammo += take;
        this.reserve -= take;
        this.reloading = false;
      }
    }

    if (!this.reloading && this.ammo === 0 && this.reserve > 0) {
      this.startReload();
    }
  }
}
