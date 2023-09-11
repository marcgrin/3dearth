import { Mesh, Group } from 'three';
const satelites = [
 {
  height: 500, longitude: 132, latitude: 35, angularVel: Math.PI / 20, mesh: undefined
 }
] as { height: number, longitude: number, latitude: number, angularVel: number, mesh: Mesh | Group | undefined }[]
for (let i = 0; i < 8; i++) {
 satelites.push({
  height: Math.random() * 400 + 100, longitude: Math.random() * 180, latitude: Math.random() * 50 + 20, angularVel: Math.PI / 20, mesh: undefined
 })
}
export default satelites