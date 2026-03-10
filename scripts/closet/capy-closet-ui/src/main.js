import { createClosetUI } from "./ui/closetUI.js"
import * as THREE from "three"

const root = document.getElementById("ui-root")

const closet = createClosetUI(root,{
  onEquip(item){
    console.log("Equip:", item)
  }
})

closet.loadItems([
 {id:"crown",name:"Crown",icon:"👑"},
 {id:"beanie",name:"Beanie",icon:"🧢"},
 {id:"chef",name:"Chef Hat",icon:"👨‍🍳"},
 {id:"scarf",name:"Scarf",icon:"🧣"}
])

/* THREE preview */

const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true})
renderer.setSize(520,520)

closet.previewCanvas.appendChild(renderer.domElement)

const scene=new THREE.Scene()

const camera=new THREE.PerspectiveCamera(50,1,0.1,100)
camera.position.z=3

const light=new THREE.DirectionalLight(0xffffff,1)
light.position.set(2,3,4)
scene.add(light)

const geo=new THREE.SphereGeometry(1,64,64)
const mat=new THREE.MeshStandardMaterial({color:"#b87b5e"})
const capy=new THREE.Mesh(geo,mat)

scene.add(capy)

function animate(){
 requestAnimationFrame(animate)
 capy.rotation.y+=0.01
 renderer.render(scene,camera)
}

animate()
