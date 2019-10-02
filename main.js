// for async/await
import 'regenerator-runtime/runtime'
import { formatDistanceStrict } from 'date-fns'

const cmds = {
  "endpoint": "https://plasma.dappchains.com/rpc",
  "status": "/status",
  "blockheight": "/blockchain?",
  "block": "/block?height=",
  "tx": "/tx?hash=", //0x675F059C43118C88A5CB5086A60ECC40DEFA2C7C874CD49AFD95E98F6823C596
}

let bs = {}
let changeInput = document.querySelector('.js-updateLoop');
let isStop = false
const afetch = async (url, options={})=>
  (await (await fetch(url, options)).json()).result

const getChainStatus = async ()=>
  await afetch(`${cmds.endpoint}${cmds.status}`)
const getBlocks = async ({from, to})=>
  await afetch(`${cmds.endpoint}${cmds.blockheight}minHeight=${from}&maxHeight=${to}`)
const onBlockClickHandler = async e => {
  const t = e.currentTarget
  const dataId = t.getAttribute('data-id')
  const block = await afetch(`${cmds.endpoint}${cmds.block}${dataId}`)
  let txHash = block.block_meta.header.data_hash
  console.log("TxHash", txHash)
  const tx = await afetch(`${cmds.endpoint}${cmds.tx}0x${txHash}`)
  console.log("tx", tx)
  document.querySelector("#blockDetail .blockHeight").textContent = "#" + dataId
  if (!tx) return
  document.querySelector("#blockDetail .txDetail>.hash>.hash").textContent = tx.hash
  document.querySelector("#blockDetail .txDetail>.result>.info").textContent = tx.tx_result.info
  document.querySelector("#blockDetail .txDetail>.result>.data").textContent = tx.tx_result.data
}

const getSinceFrom = since => formatDistanceStrict(Date.parse(since), new Date(), {includeSeconds:true})
const updateHashLists = ({blockMetas})=> {
  const list = document.querySelector("#blocks__meta")
  document.querySelectorAll("#blocks__meta .item").forEach(o=>o.remove())
  blockMetas.forEach(v=>{
    const node = document.querySelector("#blocks__meta .hash.obj").cloneNode({deep: true});
    node.classList.remove("obj")
    node.classList.add("item")
    node.setAttribute("data-id", v.header.height)
    node.querySelector('.head').textContent = "#"+v.header.height
    node.querySelector('.desc>.validator>.link').textContent = `loom${v.header.proposer_address}`
    const since = node.querySelector('.desc>.since')
    since.textContent = getSinceFrom(v.header.time)
    since.setAttribute('data-since', getSinceFrom(v.header.time))
    node.addEventListener("click", onBlockClickHandler)
    list.append(node)
  })
}



changeInput.onchange = function() {
  let checked = document.querySelector('.js-updateLoop').checked
  if (!checked) {
    console.log(changeInput.value,"stopLoop")
    window.stopLoop();
  }
  else {
    console.log(changeInput.value,"startLoop")
    window.startLoop();
  }
};

const updateLoop = async ()=> {
  bs.status = await getChainStatus()
  if (bs.status["sync_info"] && bs.status["sync_info"]["latest_block_height"] && !isStop) {
    let bh = +bs.status["sync_info"]["latest_block_height"]
    bs.blocks = await getBlocks({from: bh-9, to: +bh})
    updateHashLists({blockMetas: bs.blocks.block_metas})
    if (!isStop ) {
      nextLoop();
    }
  }
}
window.stopLoop=()=> {
  isStop = true
}
window.startLoop=()=> {
  isStop = false
  updateLoop()
}
window.nextLoop=()=>{
  setTimeout(updateLoop, 5000 )
}
const initApps = async ()=>{
  console.log(+(new Date()), "init Apps")
  updateLoop()
}
document.addEventListener('DOMContentLoaded', initApps);
