import { z } from "zod";

export const schemaTagIdGasto = z.uuid("Tag inválida.").nullish();
