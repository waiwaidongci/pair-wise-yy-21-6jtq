import path from "path";
import fs from "fs";
import { JsonStore } from "./JsonStore";
import { storeSeed } from "./seed";
import { config } from "../config/env";

const dataDir = path.resolve(config.dataDir);
fs.mkdirSync(dataDir, { recursive: true });

const filePath = path.join(dataDir, "grid-repair.json");

export const store = new JsonStore(filePath, storeSeed);

export { filePath as storeFilePath };
