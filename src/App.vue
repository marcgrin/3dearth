<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Mesh, SphereGeometry, MeshLambertMaterial, MeshBasicMaterial, Raycaster, Vector2, Line, DirectionalLight, Shape, BufferGeometry, AxesHelper, TextureLoader, Group, Spherical } from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createMultiPolygon, createPolygo, initScene } from './utils';
import china from './assets/china.json';
import world from './assets/world.json';
import Header from '@/components/Header.vue';
import chart1 from './components/chart1.vue';
import satelites from '@/assets/satelites';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import earthcol from '@/assets/earth_col_8k.jpg';
import mooncol from '@/assets/moon_4k_col.jpg';
import moonbump from '@/assets/moon_4k_bump.jpg';
const ray = new Raycaster()


const canvas = ref<HTMLDivElement>();
const district: (Mesh | Line)[][] = [];//当前地区层级记录
const districtMesh: { [key: string]: (Mesh | Line)[] } = {}//已有地区记录
const level = ['china/'];
const intersectObjects: Mesh[] = []
const earthRadius = 2000
const pointer = new Vector2(0, 0)
const onPointerMove = (e: PointerEvent) => {
  pointer.x = (e.offsetX / (canvas.value as HTMLElement).offsetWidth) * 2 - 1
  pointer.y = - (e.offsetY / (canvas.value as HTMLElement).offsetHeight) * 2 + 1;
}
const earth = new Mesh(new SphereGeometry(earthRadius, 300, 300), new MeshLambertMaterial());
const moon = new Mesh(new SphereGeometry(earthRadius / 4, 300, 300), new MeshLambertMaterial());
const createArea = (province: any) => {
  if (province.geometry.type == 'MultiPolygon') {
    const { geometry, geos } = createMultiPolygon(province.geometry.coordinates, earthRadius);
    const area = new Mesh(geometry, new MeshBasicMaterial({ transparent: true, opacity: 0.8 }))
    area.name = province.properties.name
    intersectObjects.push(area)
    const line = geos.map(i => new Line(i))
    earth.add(...line, area)
    let scale = (earthRadius + level.length * 10) / earthRadius
    gsap.to(area.scale, { x: scale, y: scale, z: scale }).duration(1)
    line.forEach(i => {
      gsap.to(i.scale, { x: scale, y: scale, z: scale }).duration(1)
    });
    return [...line, area]
  } else {
    const { geometry, geo } = createPolygo(province.geometry.coordinates, earthRadius)
    const area = new Mesh(geometry, new MeshBasicMaterial({ transparent: true, opacity: 0.8 }))
    area.name = province.properties.name
    intersectObjects.push(area)
    const line = new Line(geo)
    earth.add(line, area)
    let scale = (earthRadius + level.length * 10) / earthRadius
    gsap.to(area.scale, { x: scale, y: scale, z: scale }).duration(1)
    gsap.to(line.scale, { x: scale, y: scale, z: scale }).duration(1)
    return [line, area]
  }
}
const orbit: number[] = [2500]
satelites.forEach(satelite => {
  orbit.push(satelite.height + earthRadius)
})
orbit.forEach(o => {
  const shape = new Shape()
  shape.absarc(0, 0, o, 0, Math.PI * 2, false)
  let line = new Line(new BufferGeometry().setFromPoints(shape.getPoints(100)))
  line.rotateX(Math.PI / 2)
  earth.add(line)
})
const sateP = new OBJLoader().loadAsync('/卫星.obj')
//加载地球贴图
const texture = new TextureLoader().load(earthcol)
texture.offset.x = 0.25
earth.material.map = texture
const texture1 = new TextureLoader().load(mooncol)
texture.offset.x = 0.25
moon.material.map = texture1
const texture2 = new TextureLoader().load(moonbump)
texture.offset.x = 0.25
moon.material.bumpMap = texture2
moon.position.setFromSpherical(new Spherical((18440 / 6400) * earthRadius, Math.PI / 2, 0))
earth.add(moon)



onMounted(async () => {
  const sateMother = await sateP;
  sateMother.scale.set(0.1, 0.1, 0.1)
  satelites.forEach(i => {
    i.mesh = sateMother.clone();
    (i.mesh as Group).position.setFromSpherical(new Spherical(i.height + earthRadius, Math.PI / 2, Math.PI / 2 - i.latitude / 180 * Math.PI))
    i.mesh.lookAt(0, 0, 0)
    earth.add(i.mesh)
  })
  const { renderer, scene, camera } = initScene(canvas.value as HTMLElement, { cameraPosition: { x: 2800, y: 2800, z: 2800 } });
  renderer.sortObjects = true;
  const light = new DirectionalLight(0xffffff)
  light.position.set(4000, 0, 0)
  scene.add(light)
  // control.autoRotate = true
  earth.renderOrder = 0
  scene.add(earth, new AxesHelper(2500));
  const control = new OrbitControls(camera, renderer.domElement)
  control.enableDamping = true;

  district.push(china.features.map(createArea).reduce(function (accumulator, currentArray) {
    return accumulator.concat(currentArray);
  }, []))


  world.features.forEach((province: any) => {//世界地图
    if (province.geometry.type == 'MultiPolygon') {
      const { geos } = createMultiPolygon(province.geometry.coordinates, earthRadius);
      const line = geos.map(i => new Line(i))
      earth.add(...line)
    } else {
      const { geo } = createPolygo(province.geometry.coordinates, earthRadius)
      const line = new Line(geo)
      earth.add(line)
    }
  })

  //优化拖动逻辑，拖动取消点击事件
  let flag = false
  addEventListener('mousedown', () => {
    flag = true
  })
  addEventListener('mousemove', () => {
    flag = false
  })
  //下钻与上浮逻辑
  canvas.value?.addEventListener('mouseup', () => {
    flag && (function () {
      let obj = ray.intersectObjects(intersectObjects)[0] || undefined;
      obj && console.log(obj.object.name);
      if (obj) {//点击到可以点击的位置，下钻逻辑
        district.forEach(i => {
          i.forEach(m => {
            if ((m as Mesh).isMesh) {
              gsap.to((m.material as MeshBasicMaterial), { opacity: 0.15 })
            }
          })
        })
        intersectObjects.length = 0
        level.push(obj.object.name)
        if (obj.object.name) {
          if (districtMesh[obj.object.name]) {
            districtMesh[obj.object.name].forEach(mesh => {
              if ((mesh as Mesh).isMesh) {
                intersectObjects.push(mesh as Mesh)
              }
              earth.add(mesh)
              let scale = (earthRadius + level.length * 10) / earthRadius
              gsap.to(mesh.scale, { x: scale, y: scale, z: scale })
            })
            district.push(districtMesh[obj.object.name])
          } else {
            import('./assets/' + level.join('/') + '/' + obj.object.name + '.json').then(data => {
              const areas = data.default.features.map(createArea).reduce(function (accumulator: any, currentArray: any) {
                return accumulator.concat(currentArray);
              }, []) as (Mesh | Line)[];
              district.push(areas)
              districtMesh[obj.object.name] = areas
            })
          }
        }
      } else {//上浮逻辑
        if (level.length > 1) {//上浮条件判断
          intersectObjects.length = 0
          level.pop()
          let scale = (earthRadius + level.length * 10) / earthRadius
          district.pop()?.forEach(mesh => {
            gsap.to(mesh.scale, { x: scale, y: scale, z: scale }).then(() => {
              mesh.removeFromParent()
            })
          })
          district[district.length - 1].forEach(mesh => {
            if ((mesh as Mesh).isMesh) {
              intersectObjects.push(mesh as Mesh)
            }
            gsap.to((mesh.material as MeshBasicMaterial), { opacity: 0.8 })
          })
        }
      }
    })()
  })


  renderer.domElement.addEventListener('pointermove', onPointerMove)
  const render = () => {
    ray.setFromCamera(pointer, camera)
    control.update()
    renderer.render(scene, camera);
    requestAnimationFrame(render)
  }
  render()
})
</script>

<template>
  <Header></Header>
  <div class="canvas" ref="canvas"></div>
  <!-- <button @click="a">+1</button> -->
  <!-- <chart1></chart1> -->
</template>

<style scoped>
.canvas {
  width: 100vw;
  height: 100vh;
  background: url(./assets/bg1.gif);
}

.chart {
  width: 25vw;
  position: absolute;
}
</style>
