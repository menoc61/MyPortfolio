import * as THREE from "three";
import { EventEmitter } from "eventemitter3";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import Experience from "../Experience.js";
import Renderer from "../Renderer.js";
import { Asset } from "./assets.js";

export default class Resources extends EventEmitter {
    experience: Experience;
    renderer: Renderer;
    assets: Asset[];
    items: { [key: string]: any };
    queue: number;
    loaded: number;
    loaders!: {
        gltfLoader: GLTFLoader;
        dracoLoader: DRACOLoader;
    };
    video: { [key: string]: HTMLVideoElement } = {};
    videoTexture: { [key: string]: THREE.VideoTexture } = {};

    constructor(assets: Asset[]) {
        super();
        this.experience = new Experience();
        this.renderer = this.experience.renderer;

        this.assets = assets;

        this.items = {};
        this.queue = this.assets.length;
        this.loaded = 0;

        this.setLoaders();
        this.startLoading();
    }

    setLoaders() {
        this.loaders = {
            gltfLoader: new GLTFLoader(),
            dracoLoader: new DRACOLoader(),
        };
        this.loaders.dracoLoader.setDecoderPath("/draco/");
        this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);
    }

    startLoading() {
        for (const asset of this.assets) {
            if (asset.type === "glbModel") {
                this.loaders.gltfLoader.load(asset.path, (file) => {
                    this.singleAssetLoaded(asset, file);
                });
            } else if (asset.type === "videoTexture") {
                this.video[asset.name] = document.createElement("video");
                this.video[asset.name].src = asset.path;
                this.video[asset.name].muted = true;
                this.video[asset.name].playsInline = true;
                this.video[asset.name].autoplay = true;
                this.video[asset.name].loop = true;
                this.video[asset.name].play();

                this.videoTexture[asset.name] = new THREE.VideoTexture(
                    this.video[asset.name]
                );
                this.videoTexture[asset.name].minFilter = THREE.NearestFilter;
                this.videoTexture[asset.name].magFilter = THREE.NearestFilter;
                this.videoTexture[asset.name].generateMipmaps = false;
                this.videoTexture[asset.name].colorSpace = THREE.SRGBColorSpace;

                this.singleAssetLoaded(asset, this.videoTexture[asset.name]);
            }
        }
    }

    singleAssetLoaded(asset: Asset, file: any) {
        this.items[asset.name] = file;
        this.loaded++;

        if (this.loaded === this.queue) {
            this.emit("ready");
        }
    }
}
