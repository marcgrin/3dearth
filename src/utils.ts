import { WebGLRenderer, Scene, PerspectiveCamera, Vector3, BufferGeometry, Shape, ShapeGeometry, Spherical, ExtrudeGeometry, Loader, TextureLoader } from "three";
import * as d3 from 'd3';
import { ConicPolygonGeometry } from 'three-conic-polygon-geometry';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const projection = d3.geoMercator().scale(2500);
const reverse = projection.invert as (point: [number, number]) => [number, number]


export const initScene = (DOM: HTMLElement, param: { cameraPosition: { x: number, y: number, z: number } }) => {
 const renderer = new WebGLRenderer({ alpha: true });
 const scene = new Scene();
 const camera = new PerspectiveCamera(undefined, DOM.offsetWidth / DOM.offsetHeight, undefined, 9000);
 camera.position.set(param.cameraPosition.x, param.cameraPosition.y, param.cameraPosition.z)
 window.addEventListener('resize', () => {
  camera.aspect = DOM.offsetWidth / DOM.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(DOM.offsetWidth, DOM.offsetHeight)
 })
 renderer.setSize(DOM.offsetWidth, DOM.offsetHeight);
 DOM.appendChild(renderer.domElement);
 const uninstall = () => {
  window.removeEventListener('resize', () => {
   camera.aspect = DOM.offsetWidth / DOM.offsetHeight;
   camera.updateProjectionMatrix();
   renderer.setSize(DOM.offsetWidth, DOM.offsetHeight)
  })
 }
 return { scene, camera, renderer, uninstall }
}


export const createMultiPolygon = (MultiPolygon: any, radius: number) => {
 let geometries: BufferGeometry[] = [];
 let geos: BufferGeometry[] = [];
 MultiPolygon.forEach((i: any) => {
  const { geometry, geo } = createPolygo(i, radius)
  geometries.push(geometry)
  geos.push(geo)
 })
 const geometry = mergeGeometries(geometries)
 return { geometry, geos }
}


export const createPolygo = (Polygon: any, radius: number) => {
 let vertices: Vector3[] = []
 let points: [number, number][] = []
 Polygon.forEach((area: [number, number][]) => {
  area.forEach((coordnates: [number, number]) => {
   vertices.push(new Vector3().setFromSpherical(new Spherical(radius, Math.PI / 2 - coordnates[1] / 180 * Math.PI, coordnates[0] / 180 * Math.PI)))
   let [x, y] = projection(coordnates) as [number, number]
   points.push([x, -y])
  })
 })
 const geometry = new ConicPolygonGeometry(Polygon, radius, radius + 10)
 return { geo: new BufferGeometry().setFromPoints(vertices), geometry }
}

export const createPolygo1 = (Polygon: any, radius: number) => {
 let vertices: Vector3[] = []
 let points: [number, number][] = []
 Polygon.forEach((area: [number, number][]) => {
  area.forEach((coordnates: [number, number]) => {
   vertices.push(new Vector3().setFromSpherical(new Spherical(radius, Math.PI / 2 - coordnates[1] / 180 * Math.PI, coordnates[0] / 180 * Math.PI)))
   let [x, y] = projection(coordnates) as [number, number]
   points.push([x, -y])
  })
 })
 let shape = new Shape()
 points.forEach((i, index) => {
  if (index) {
   shape.lineTo(i[0], i[1])
  } else {
   shape.moveTo(i[0], i[1])
  }
 })
 const geometry = new ShapeGeometry(shape)
 const TDGeometry = new ExtrudeGeometry(shape, { depth: 30 })
 for (let i = 0; i < geometry.attributes.position.count; i++) {
  const [x, y] = reverse([geometry.attributes.position.array[i * 3], -geometry.attributes.position.array[i * 3 + 1]])
  const newposition = new Vector3().setFromSpherical(new Spherical(radius, Math.PI / 2 - y / 180 * Math.PI, x / 180 * Math.PI))
  geometry.attributes.position.array[i * 3] = newposition.x
  geometry.attributes.position.array[i * 3 + 1] = newposition.y
  geometry.attributes.position.array[i * 3 + 2] = newposition.z
 }
 for (let i = 0; i < TDGeometry.attributes.position.count; i++) {
  const [x, y] = reverse([TDGeometry.attributes.position.array[i * 3], -TDGeometry.attributes.position.array[i * 3 + 1]])
  const newposition = new Vector3().setFromSpherical(new Spherical(radius, Math.PI / 2 - y / 180 * Math.PI, x / 180 * Math.PI))
  TDGeometry.attributes.position.array[i * 3] = newposition.x
  TDGeometry.attributes.position.array[i * 3 + 1] = newposition.y
  TDGeometry.attributes.position.array[i * 3 + 2] = newposition.z
 }
 return { geometry, geo: new BufferGeometry().setFromPoints(vertices), TDGeometry }
}


export const skyBox = () => {
 const url = 'https://csdnimg.cn/release/blogv2/dist/pc/themesSkin/skin-whitemove/images/bg.gif'
 new TextureLoader().load(url, (texture) => {
  console.log(texture);
 })
}