from pygltflib import GLTF2
gltf = GLTF2().load('/Users/dima1203/Desktop/model/scifi_control_room.glb')
print([node.name for node in gltf.nodes][:10])
