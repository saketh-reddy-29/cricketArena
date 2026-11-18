import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

/**
 * Mount inside React.Suspense to wait for the GLTF and its textures to finish loading.
 * This component deliberately renders nothing: no proxy meshes or placeholder characters.
 */
export default function ModelPreloader({
  modelUrl,
  onReady,
}: {
  modelUrl: string;
  onReady: (modelUrl: string) => void;
}) {
  const asset = useGLTF(modelUrl);

  useEffect(() => {
    if (asset.scene) onReady(modelUrl);
  }, [asset, modelUrl, onReady]);

  return null;
}
