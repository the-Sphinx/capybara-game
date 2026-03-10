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
