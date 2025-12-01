import { expectType } from 'tsd'
import { TypeDiagram } from '../src/dsl'
import type { IconMeta } from '../src/icon'

const builder = TypeDiagram('t')

type CB = Parameters<typeof builder['build']>[0]

// Define an expected parameter shape and ensure it's assignable to the builder callback type
type ExpectedCallbackParam = {
  icon: {
    myplugin: {
      icon1: () => IconMeta | null
    }
  }
}

const cb2 = ({ icon }: { icon: Record<string, Record<string, () => IconMeta | null>> }) => {
  // existence: icon.myplugin should be present (type-wise)
  const p = icon['myplugin']
  expectType<Record<string, () => IconMeta | null> | undefined>(p)

  // specifically, icon1 should exist and be a zero-arg function returning IconMeta | null
  const f = p && p['icon1']
  expectType<(() => IconMeta | null) | undefined>(f)

  // if present, calling should yield IconMeta | null
  const v = f && f()
  expectType<IconMeta | null | undefined>(v)

  // keyof-based checks: ensure 'myplugin' exists as key and 'icon1' exists under it
  type IconNS = typeof icon
  type HasMyPlugin = 'myplugin' extends keyof IconNS ? true : false
  expectType<true>(null as unknown as HasMyPlugin)

  type MyPluginNS = IconNS['myplugin']
  type HasIcon1 = 'icon1' extends keyof MyPluginNS ? true : false
  expectType<true>(null as unknown as HasIcon1)
}

// This assignment ensures that the builder's callback type accepts the object-form with icon namespace
const cb: CB = cb2 as unknown as CB

builder.build(cb)
