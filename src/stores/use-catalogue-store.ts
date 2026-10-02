import { defaultFantas, Fanta } from '@/data/fantas'
import { supabase } from '@/lib/supabase'
import { create } from 'zustand'

type CatalogueStatus = 'loading' | 'ready' | 'offline'

type NewFanta = {
    name: string,
    category: string,
    zero_sugar: boolean,
}

interface CatalogueState {
    fantas: Fanta[],
    status: CatalogueStatus,
    loadCatalogue: () => Promise<void>,
    addFanta: (fanta: NewFanta) => Promise<Fanta>,
    addBarcode: (fantaId: string, barcode: string) => Promise<void>,
}

// "Fanta  Apple Sour " -> "Apple Sour": the other names don't start with "Fanta" either.
// Exported so the add screen can use the same rule to check if a Fanta already exists.
export const cleanFantaName = (name: string) => name.trim().replace(/^fanta\s+/i, '').replace(/\s+/g, ' ')

// "Mango Dragonfruit!" -> "fanta-mango-dragonfruit"
const toFantaId = (name: string) =>
    'fanta-' + name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const useCatalogueStore = create<CatalogueState>()((set, get) => ({
    // Starts with the bundled Fantas, so the list is filled immediately, even offline.
    fantas: defaultFantas,
    status: 'loading',

    loadCatalogue: async () => {
        set({ status: 'loading' })
        const { data, error } = await supabase.from('flavours').select('*').order('name')

        if (error || !data) {
            // No internet (or Supabase is down): keep whatever we already have.
            set({ status: 'offline' })
            return
        }

        // Merge on id: the bundled Fantas stay first, database rows replace or extend them.
        const fantasById = new Map(defaultFantas.map((fanta) => [fanta.id, fanta]))
        for (const row of data as Fanta[]) {
            fantasById.set(row.id, row)
        }
        set({ fantas: [...fantasById.values()], status: 'ready' })
    },

    addFanta: async (fanta) => {
        const name = cleanFantaName(fanta.name)
        if (name.length < 2) {
            throw new Error('The name needs at least 2 characters.')
        }

        const { data: { session } } = await supabase.auth.getSession()
        const { data, error } = await supabase
            .from('flavours')
            .insert({ ...fanta, name, id: toFantaId(name), created_by: session?.user.id })
            .select()
            .single()

        if (error) {
            throw new Error(error.code === '23505' ? 'This Fanta already exists.' : error.message)
        }

        // Add the saved row straight to the list: no need to reload the whole catalogue.
        set((state) => ({ fantas: [...state.fantas, data as Fanta] }))
        return data as Fanta
    },

    addBarcode: async (fantaId, barcode) => {
        const fanta = get().fantas.find((fanta) => fanta.id === fantaId)
        if (!fanta || fanta.barcodes.includes(barcode)) {
            return
        }

        const barcodes = [...fanta.barcodes, barcode]
        const { error } = await supabase.from('flavours').update({ barcodes }).eq('id', fantaId)
        if (error) {
            throw new Error(error.message)
        }

        set((state) => ({
            fantas: state.fantas.map((fanta) => fanta.id === fantaId ? { ...fanta, barcodes } : fanta),
        }))
    },
}))

// Runs once, when this file is first imported (at app start). No useEffect needed.
useCatalogueStore.getState().loadCatalogue()
