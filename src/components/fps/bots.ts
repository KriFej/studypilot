import * as THREE from 'three';
import { WeaponDef, WEAPONS } from './weapons';
import { AudioManager } from './audio';

export interface BotConfig {
  position: THREE.Vector3;
  mobile: boolean;
  shoots: boolean;
  health?: number;
}

type BotState = 'idle' | 'patrol' | 'chase' | 'attack' | 'cover' | 'dead';

export class Bot {
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  state: BotState = 'idle';
  mobile: boolean;
  shoots: boolean;
  private vel = new THREE.Vector3();
  private target = new THREE.Vector3();
  private patrolTimer = 0;
  private shootTimer = 0;
  private coverPoint: THREE.Vector3 | null = null;
  private coverTimer = 0;
  private stateTimer = 0;
  private weapon: WeaponDef;
  private audio: AudioManager;
  alive = true;
  headMesh!: THREE.Mesh;
  bodyMesh!: THREE.Mesh;
  private hitFlashTimer = 0;
  private bodyMat!: THREE.MeshStandardMaterial;
  deathTimer = 0;
  private readonly SHOOT_RANGE = 35;
  private readonly AGGRO_RANGE = 40;
  private scene: THREE.Scene;

  constructor(cfg: BotConfig, scene: THREE.Scene, audio: AudioManager) {
    this.scene = scene;
    this.audio = audio;
    this.health = cfg.health ?? 100;
    this.maxHealth = this.health;
    this.mobile = cfg.mobile;
    this.shoots = cfg.shoots;
    this.weapon = WEAPONS.ar;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(cfg.position);

    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.6, roughness: 0.4 });
    this.bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.5), this.bodyMat);
    this.bodyMesh.position.y = 0.6;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, metalness: 0.1, roughness: 0.8 });
    this.headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), headMat);
    this.headMesh.position.y = 1.45;
    this.headMesh.castShadow = true;
    this.mesh.add(this.headMesh);

    // Visor
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00eeff, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 });
    const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), visorMat);
    visor.position.set(0, 1.48, 0.22);
    this.mesh.add(visor);

    // Gun model
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), gunMat);
    gun.position.set(0.45, 0.8, 0.2);
    this.mesh.add(gun);

    scene.add(this.mesh);

    if (this.mobile) {
      this.state = 'patrol';
      this.pickPatrolTarget(cfg.position);
    }
  }

  private pickPatrolTarget(origin: THREE.Vector3) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 12;
    this.target.set(
      origin.x + Math.cos(angle) * dist,
      0,
      origin.z + Math.sin(angle) * dist
    );
    this.target.x = Math.max(-45, Math.min(45, this.target.x));
    this.target.z = Math.max(-45, Math.min(45, this.target.z));
  }

  hit(damage: number): boolean {
    if (!this.alive) return false;
    this.health -= damage;
    this.hitFlashTimer = 0.1;
    this.bodyMat.emissive.setHex(0xff0000);
    this.bodyMat.emissiveIntensity = 1;
    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die() {
    this.alive = false;
    this.state = 'dead';
    this.deathTimer = 3;
    this.audio.botDeath();
    this.mesh.rotation.z = Math.PI / 2;
    this.mesh.position.y = -0.3;
    this.bodyMat.color.setHex(0x440000);
    this.bodyMat.emissive.setHex(0x220000);
    this.bodyMat.emissiveIntensity = 0.2;
  }

  getHeadPosition(): THREE.Vector3 {
    return this.mesh.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  }

  getBodyPosition(): THREE.Vector3 {
    return this.mesh.position.clone().add(new THREE.Vector3(0, 0.6, 0));
  }

  update(dt: number, playerPos: THREE.Vector3, onShoot: (origin: THREE.Vector3, dir: THREE.Vector3) => void, coverPoints: THREE.Vector3[]) {
    if (!this.alive) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.scene.remove(this.mesh);
      }
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        this.bodyMat.emissive.setHex(0x000000);
        this.bodyMat.emissiveIntensity = 0;
      }
    }

    this.stateTimer -= dt;
    this.shootTimer -= dt;

    const distToPlayer = this.mesh.position.distanceTo(playerPos);

    // State transitions
    if (distToPlayer < this.AGGRO_RANGE && this.mobile) {
      if (distToPlayer < this.SHOOT_RANGE) {
        if (Math.random() < 0.01 && this.state !== 'attack') {
          this.state = 'cover';
          this.coverTimer = 1 + Math.random() * 2;
          if (coverPoints.length > 0) {
            // Find nearest cover away from player
            let bestDist = 0;
            let bestCover = coverPoints[0];
            for (const cp of coverPoints) {
              const d = cp.distanceTo(playerPos);
              if (d > bestDist) { bestDist = d; bestCover = cp; }
            }
            this.coverPoint = bestCover.clone();
          }
        } else if (this.state !== 'cover') {
          this.state = 'attack';
        }
      } else {
        this.state = 'chase';
      }
    } else if (this.mobile && this.state === 'attack') {
      this.state = 'patrol';
      this.pickPatrolTarget(this.mesh.position);
    }

    // Movement
    if (this.mobile) {
      let moveTarget: THREE.Vector3 | null = null;

      if (this.state === 'patrol') {
        moveTarget = this.target;
        if (this.mesh.position.distanceTo(this.target) < 1.5 || this.stateTimer <= 0) {
          this.pickPatrolTarget(this.mesh.position);
          this.stateTimer = 4 + Math.random() * 4;
        }
      } else if (this.state === 'chase') {
        moveTarget = playerPos;
      } else if (this.state === 'cover' && this.coverPoint) {
        moveTarget = this.coverPoint;
        this.coverTimer -= dt;
        if (this.coverTimer <= 0 || this.mesh.position.distanceTo(this.coverPoint) < 1) {
          this.state = 'attack';
          this.coverPoint = null;
        }
      }

      if (moveTarget) {
        const dir = moveTarget.clone().sub(this.mesh.position);
        dir.y = 0;
        const len = dir.length();
        if (len > 0.5) {
          dir.normalize();
          const speed = this.state === 'chase' ? 5 : 3;
          this.vel.x += (dir.x * speed - this.vel.x) * Math.min(dt * 8, 1);
          this.vel.z += (dir.z * speed - this.vel.z) * Math.min(dt * 8, 1);
        } else {
          this.vel.x *= Math.pow(0.05, dt);
          this.vel.z *= Math.pow(0.05, dt);
        }

        this.mesh.position.x += this.vel.x * dt;
        this.mesh.position.z += this.vel.z * dt;
        this.mesh.position.y = 0;

        if (len > 0.5) {
          const angle = Math.atan2(dir.x, dir.z);
          this.mesh.rotation.y = angle;
        }
      }
    }

    // Look at player when attacking
    if (this.state === 'attack' || (this.shoots && distToPlayer < this.SHOOT_RANGE)) {
      const toPlayer = playerPos.clone().sub(this.mesh.position);
      toPlayer.y = 0;
      this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }

    // Shooting
    if (this.shoots && this.state === 'attack' && distToPlayer < this.SHOOT_RANGE && this.shootTimer <= 0) {
      const fireRate = 60 / this.weapon.rpm;
      this.shootTimer = fireRate + Math.random() * 0.3;

      const origin = this.getBodyPosition().add(new THREE.Vector3(0, 0.3, 0));
      const toPlayer = playerPos.clone().sub(origin).normalize();
      // Add inaccuracy
      const spread = 0.08;
      toPlayer.x += (Math.random() - 0.5) * spread;
      toPlayer.y += (Math.random() - 0.5) * spread;
      toPlayer.z += (Math.random() - 0.5) * spread;
      toPlayer.normalize();

      onShoot(origin, toPlayer);
    }

    // Idle bob
    if (!this.mobile) {
      this.mesh.position.y = Math.sin(Date.now() * 0.001) * 0.02;
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
