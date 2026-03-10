#!/bin/bash

mkdir -p capy-closet-ui/src/ui
cd capy-closet-ui

#################################
# package.json
#################################

cat > package.json << 'EOF'
{
  "name": "capy-closet-ui",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "three": "^0.160.0",
    "gsap": "^3.12.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
EOF

#################################
# vite config
#################################

cat > vite.config.js << 'EOF'
import { defineConfig } from "vite"

export default defineConfig({
  server:{
    port:5173
  }
})
EOF

#################################
# index.html
#################################

cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Capy Closet</title>
<link rel="stylesheet" href="/src/ui/styles.css">
</head>

<body>

<canvas id="game"></canvas>
<div id="ui-root"></div>

<script type="module" src="/src/main.js"></script>

</body>
</html>
EOF

#################################
# main.js
#################################

cat > src/main.js << 'EOF'
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
EOF

#################################
# closetUI.js
#################################

cat > src/ui/closetUI.js << 'EOF'
import {createItemCard} from "./itemCard.js"
import gsap from "gsap"

export function createClosetUI(root,options){

const container=document.createElement("div")
container.className="closet-container"

const preview=document.createElement("div")
preview.className="preview-frame"

const previewCanvas=document.createElement("div")
previewCanvas.className="preview-canvas"

preview.appendChild(previewCanvas)

const right=document.createElement("div")
right.className="closet-right"

const title=document.createElement("h2")
title.textContent="Capy Closet"

const tabs=document.createElement("div")
tabs.className="tabs"

const hats=document.createElement("button")
hats.className="tab active"
hats.textContent="🎩 Hats"

const neck=document.createElement("button")
neck.className="tab"
neck.textContent="🎀 Neck"

tabs.append(hats,neck)

const grid=document.createElement("div")
grid.className="items-grid"

const equip=document.createElement("button")
equip.className="equip-btn"
equip.textContent="EQUIP 🐾"

right.append(title,tabs,grid,equip)

container.append(preview,right)
root.appendChild(container)

gsap.from(container,{scale:.8,opacity:0,duration:.4})

let selected=null
let selectedItem=null

function loadItems(items){

grid.innerHTML=""

items.forEach(item=>{

const card=createItemCard(item,(data,el)=>{

if(selected)selected.classList.remove("selected")

el.classList.add("selected")
selected=el
selectedItem=data

})

grid.appendChild(card)

})

}

equip.onclick=()=>{
if(selectedItem && options.onEquip){
options.onEquip(selectedItem)
}
}

return{
previewCanvas,
loadItems
}

}
EOF

#################################
# itemCard.js
#################################

cat > src/ui/itemCard.js << 'EOF'
export function createItemCard(item,onSelect){

const card=document.createElement("div")
card.className="item-card"

const icon=document.createElement("div")
icon.className="item-icon"
icon.textContent=item.icon

const name=document.createElement("div")
name.className="item-name"
name.textContent=item.name

card.append(icon,name)

card.onclick=()=>onSelect(item,card)

return card

}
EOF

#################################
# styles.css
#################################

cat > src/ui/styles.css << 'EOF'

body{
margin:0;
font-family: "Nunito", sans-serif;
background: linear-gradient(#8cc2d6,#a6e2c6);
height:100vh;
display:flex;
align-items:center;
justify-content:center;
}

.closet-container{
width:1150px;
height:680px;
background:#f3e6cf;
border-radius:32px;
padding:30px;
display:flex;
gap:30px;
box-shadow:0 12px 0 #d5c4a4;
}

.preview-frame{
flex:1;
background:#f4cbb4;
border-radius:28px;
border:6px solid #f0b097;
display:flex;
align-items:center;
justify-content:center;
}

.closet-right{
width:420px;
display:flex;
flex-direction:column;
}

.closet-right h2{
text-align:center;
margin:0 0 10px 0;
}

.tabs{
display:flex;
gap:12px;
margin-bottom:10px;
}

.tab{
flex:1;
padding:10px;
border:none;
border-radius:18px;
font-weight:bold;
background:#e9d6b7;
cursor:pointer;
}

.tab.active{
background:linear-gradient(#ffd469,#ffb22d);
box-shadow:0 4px 0 #d49100;
}

.items-grid{
flex:1;
background:#e8d9b9;
border-radius:22px;
padding:14px;
display:grid;
grid-template-columns:1fr 1fr;
gap:16px;
}

.item-card{
background:#f3f3f3;
border-radius:20px;
padding:20px;
text-align:center;
cursor:pointer;
transition:transform .15s;
}

.item-card:hover{
transform:translateY(-6px);
}

.item-card.selected{
outline:4px solid #ffb22d;
box-shadow:0 0 12px #ffc95a;
}

.item-icon{
font-size:40px;
margin-bottom:6px;
}

.item-name{
font-weight:bold;
}

.equip-btn{
margin-top:16px;
padding:16px;
border:none;
border-radius:22px;
font-size:22px;
font-weight:bold;
background:linear-gradient(#ffd469,#ff9f00);
box-shadow:0 6px 0 #d68500;
cursor:pointer;
}

.equip-btn:active{
transform:translateY(3px);
box-shadow:0 3px 0 #d68500;
}

EOF

echo "Capy Closet project created!"