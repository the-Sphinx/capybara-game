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
