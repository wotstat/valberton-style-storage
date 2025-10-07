import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import * as z from 'zod'
import { Database } from "bun:sqlite";


const VehicleDataSchema = z.object({
  isWithAlternateItems: z.boolean(),
  outfit: z.union([z.number(), z.string()])
});

const VehiclesConfigSchema = z.record(z.string(), VehicleDataSchema);


const StateDB = new Database('./SQLite/valberton-style-storage.sqlite', { create: true })
StateDB.run(`
  create table if not exists Storage (
    id         TEXT    NOT NULL,
    vehicle    JSON    NOT NULL,
    isWithAlternateItems BOOLEAN NOT NULL,
    outfit     TEXT    NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    updated_at DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    primary key (id, vehicle)
  )
`)

const getState = StateDB.query<{ vehicle: string, isWithAlternateItems: boolean, outfit: string }, { $id: string }>(`SELECT vehicle, isWithAlternateItems, outfit FROM Storage WHERE id = $id`)
const setState = StateDB.query<{}, { $id: string, $vehicle: string, $isWithAlternateItems: boolean, $outfit: string }>(`
  INSERT INTO Storage (id, vehicle, isWithAlternateItems, outfit, created_at, updated_at)
  VALUES ($id, $vehicle, $isWithAlternateItems, $outfit, STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'), STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  ON CONFLICT(id, vehicle) DO UPDATE SET
    isWithAlternateItems = excluded.isWithAlternateItems,
    outfit = excluded.outfit,
    updated_at = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')
`)
const removeState = StateDB.query<{}, { $id: string }>(`DELETE FROM Storage WHERE id = $id`)
const getStateByUserVehicles = StateDB.query<{ vehicle: string, isWithAlternateItems: boolean, outfit: string }, { $id: string, $vehicle: string }>(
  `SELECT vehicle, isWithAlternateItems, outfit FROM Storage WHERE id = $id AND vehicle = $vehicle`
)

function parseOutfit(outfit: string): number | string {
  try {
    return JSON.parse(outfit)
  } catch {
    return outfit
  }
}

export const app = new Hono()

app.get(
  '/settings',
  zValidator('query', z.object({ id: z.string() })),
  (c) => {
    const { id } = c.req.valid('query')

    const rows = getState.all({ $id: id })
    const result: Record<string, { isWithAlternateItems: boolean, outfit: number | string }> = {}
    for (const row of rows) {
      result[row.vehicle] = {
        isWithAlternateItems: !!row.isWithAlternateItems,
        outfit: parseOutfit(row.outfit)
      }
    }

    return c.json(result)
  }
)

app.put(
  '/settings',
  zValidator('query', z.object({ id: z.string() })),
  zValidator('json', VehiclesConfigSchema),
  (c) => {
    const data = c.req.valid('json')

    const { id } = c.req.valid('query')
    removeState.run({ $id: id })
    for (const [vehicle, vdata] of Object.entries(data)) {
      setState.run({
        $id: id,
        $vehicle: vehicle,
        $isWithAlternateItems: vdata.isWithAlternateItems,
        $outfit: JSON.stringify(vdata.outfit)
      })
    }

    return c.json({ status: 'ok' })
  }
)

app.patch(
  '/settings',
  zValidator('query', z.object({ id: z.string() })),
  zValidator('json', VehiclesConfigSchema),
  (c) => {
    const data = c.req.valid('json')

    const { id } = c.req.valid('query')
    for (const [vehicle, vdata] of Object.entries(data)) {
      setState.run({
        $id: id,
        $vehicle: vehicle,
        $isWithAlternateItems: vdata.isWithAlternateItems,
        $outfit: JSON.stringify(vdata.outfit)
      })
    }

    return c.json({ status: 'ok' })
  }
)

app.post(
  '/settings/user-vehicles',
  zValidator('json', z.array(z.object({
    id: z.number(),
    vehicle: z.string()
  }))),
  (c) => {
    const data = c.req.valid('json')

    const result: Record<string, { isWithAlternateItems: boolean, outfit: number | string } | null> = {}

    for (const { id, vehicle } of data) {
      const row = getStateByUserVehicles.get({ $id: `${id}`, $vehicle: vehicle })
      if (!row) continue

      result[`${id}:${vehicle}`] = {
        isWithAlternateItems: !!row.isWithAlternateItems,
        outfit: parseOutfit(row.outfit)
      }
    }

    return c.json(result)
  }
)

