import * as THREE from "three";
import type { FrameEntry } from "./myrmidonAnim";

export class FESpriteAnimator {
  readonly sprite: THREE.Sprite;
  private mat: THREE.SpriteMaterial;
  private textures: Map<string, THREE.Texture> = new Map();
  private basePath: string;

  private currentClip: FrameEntry[] = [];
  private clipLoop = false;
  private clipIdx = 0;
  private clipStartMs = 0;
  private playing = false;

  private isEnemy: boolean;
  private onDone?: () => void;
  private onFrameChangeCb: ((file: string) => void) | null = null;
  private textureFilter: THREE.MagnificationTextureFilter;

  constructor(
    basePath: string,
    isEnemy = false,
    textureFilter: THREE.MagnificationTextureFilter = THREE.NearestFilter,
  ) {
    this.basePath = basePath.replace(/\/$/, "");
    this.isEnemy = isEnemy;
    this.textureFilter = textureFilter;
    this.mat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false });
    this.sprite = new THREE.Sprite(this.mat);
  }

  preload(files: string[]): Promise<void[]> {
    const loader = new THREE.TextureLoader();
    const promises = files.map((file) => {
      if (this.textures.has(file)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        loader.load(
          `${this.basePath}/${file}.png`,
          (tex) => {
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.magFilter = this.textureFilter;
            tex.minFilter = this.textureFilter as THREE.MinificationTextureFilter;
            this.textures.set(file, tex);
            resolve();
          },
          undefined,
          () => {
            resolve();
          },
        );
      });
    });
    return Promise.all(promises);
  }

  setEnemy(isEnemy: boolean) {
    this.isEnemy = isEnemy;
    if (this.mat.map) {
      this.applyFlip(this.mat.map);
      this.mat.map.needsUpdate = true;
    }
  }

  /** Register a callback fired every time the displayed frame changes. Pass null to clear. */
  onFrameChange(cb: ((file: string) => void) | null) {
    this.onFrameChangeCb = cb;
  }

  playClip(clip: FrameEntry[], loop = false, onDone?: () => void) {
    this.currentClip = clip;
    this.clipLoop = loop;
    this.clipIdx = 0;
    this.clipStartMs = performance.now();
    this.playing = true;
    this.onDone = onDone;
    this.showFrame(clip[0]?.file ?? "");
  }

  update(nowMs: number) {
    if (!this.playing || this.currentClip.length === 0) return;

    const elapsed = nowMs - this.clipStartMs;
    let acc = 0;
    let targetIdx = 0;
    for (let i = 0; i < this.currentClip.length; i++) {
      acc += this.currentClip[i].durationMs;
      if (elapsed < acc) {
        targetIdx = i;
        break;
      }
      targetIdx = i;
    }

    const totalDuration = this.currentClip.reduce((s, f) => s + f.durationMs, 0);

    if (elapsed >= totalDuration) {
      if (this.clipLoop) {
        this.clipStartMs = nowMs - (elapsed % totalDuration);
        this.showFrame(this.currentClip[0].file);
      } else {
        this.playing = false;
        this.showFrame(this.currentClip[this.currentClip.length - 1].file);
        this.onDone?.();
      }
      return;
    }

    this.showFrame(this.currentClip[targetIdx].file);
  }

  private applyFlip(tex: THREE.Texture) {
    if (this.isEnemy) {
      tex.repeat.set(-1, 1);
      tex.offset.set(1, 0);
    } else {
      tex.repeat.set(1, 1);
      tex.offset.set(0, 0);
    }
  }

  private showFrame(file: string) {
    const tex = this.textures.get(file);
    if (!tex) return;
    if (this.mat.map !== tex) {
      this.applyFlip(tex);
      tex.needsUpdate = true;
      this.mat.map = tex;
      this.mat.needsUpdate = true;
      this.onFrameChangeCb?.(file);
    }
  }

  dispose() {
    for (const tex of this.textures.values()) tex.dispose();
    this.mat.dispose();
  }
}
