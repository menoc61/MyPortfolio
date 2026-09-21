export interface Asset {
    name: string;
    type: "glbModel" | "videoTexture";
    path: string;
}

const assets: Asset[] = [
    {
        name: "room",
        type: "glbModel",
        path: "/models/Finale Version 16.glb",
    },
    {
        name: "screen",
        type: "videoTexture",
        path: "/textures/kda.mp4",
    },
];

export default assets;
