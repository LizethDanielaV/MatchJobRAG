// scripts/00-limpiar_index.js
import PineconeUtils from "../Utils/PineconeUtils.js";

const pineconeUtils = new PineconeUtils();

async function main() {
  await pineconeUtils.borrarTodo();
}

main(); 