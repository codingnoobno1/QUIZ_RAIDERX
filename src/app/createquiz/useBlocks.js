import { useEffect, useState } from "react";

export default function useBlocks() {
  const [blocks, setBlocks] = useState([]);
  useEffect(() => {
    fetch("/block.json")
      .then((res) => res.json())
      .then((data) => setBlocks(data.blocks || []));
  }, []);
  return blocks;
}
