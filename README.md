# Electro Forge 3D

An AI circuit workbench: describe a change in plain English and watch it happen on a 3D breadboard.

![Dashboard](docs/phase1-dashboard.png)

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Stack

- React 18 + TypeScript, built with Vite
- Three.js through `@react-three/fiber` and `@react-three/drei`. Every part is modelled in code, so there are no image assets.
- Tailwind CSS for the UI, `zustand` for state, `lucide-react` icons

## Layout

```
src/
  circuit/     data model: board geometry, parts, values, starting circuit and history
  store/       app state (circuit, history, panel tab, camera commands)
  scene/       3D: breadboard, camera rig, one component per part type
  components/  UI: header, project badge, view toolbar, prompt bar, side panel
```

## Roadmap

1. **App shell + 3D board** (this build)
2. Command engine + pick-and-place animations (move / flip / swap / recolor / blink rate)
3. Working suggestion chips, Circuit tab netlist, search, notifications, undo
4. Forge AI: optional local LLM (Ollama) for free-form prompts
5. Lessons, Lab and Components pages
