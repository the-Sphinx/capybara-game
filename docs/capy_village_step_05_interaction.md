# Capy Village — Step 05: Building Interaction System

## Goal

Add the first interaction system to the prototype so the capy can approach a building, see a prompt, and press a key to trigger a placeholder building message.

This step is complete only when:
- at least one building is interactable
- a prompt appears when the capy is in the correct interaction zone
- pressing E triggers a visible placeholder building message
- the interaction is stable and does not trigger accidentally from far away

## Prerequisite

Step 04 must already be working:
- capy moves correctly
- camera follows correctly
- placeholder village layout exists
- buildings are placed in the scene
- no console errors

## Interaction Design Principle

do NOT use a fixed distance from the center of the building.
Instead, use an explicit interaction zone placed in front of each interactable building.
Buildings can have different sizes and shapes, so center-distance triggers are unreliable.

## Required Interaction Method
Each interactable building must have:
1. a building mesh
2. an interaction zone
3. a building id / name
4. placeholder interaction text

Suggested properties for each:
- **id** (example: capy-store)
- **label** (example: Capy Store)
- **mesh** reference
- **trigger zone**
- **placeholder message**

### Example conceptual structure:
```js
{
  id: 'capy-store',
  label: 'Capy Store',
  mesh: buildingMesh,
  triggerZone: interactionBox,
  message: 'This building will open the capy customization screen later.'
}
```

## Trigger Zone Requirements
### Shape
Use a simple rectangular trigger area.
Possible implementations include:
- invisible box area,
- axis-aligned bounding box,
- rectangle on the ground plane.
The trigger should not be visible to the player.

### Placement
The trigger zone must be positioned in front of the building entrance area, not at the building center.
Example mental model::
     building
  ┌────────────┐
  │            │
  │   house    │
  │            │
  └────────────┘
       ↓
   trigger zone

### Size
The zone size should be set per building.
It should be:
- wide enough for the capy to stand in naturally
- shallow enough that the interaction does not trigger from far away

Suggested guideline:
- width ≈ building front width
- depth ≈ 1 to 1.5 capy lengths

## Interaction Detection
Each frame:
1. determine capy position
2. check whether capy position is inside any building trigger zone
3. if inside one zone:
    - mark that building as the active interaction target
4. if not inside any zone:
    - clear the active interaction target

Do NOT use building center distance.

Do NOT use mesh radius.

Do NOT use camera raycasting.


## Input

Use the key: E

Behavior:
If the capy is inside a valid building trigger zone and the player presses E, trigger that building’s placeholder interaction.


## Prompt UI

When the capy is inside a valid trigger zone, show a prompt.

Example: Press E to enter Capy Store


## Prompt Placement

The prompt must appear at the bottom-center of the screen.

Reason:
- easy to notice
- does not block camera view
- common in many games


## Prompt Style

Keep it simple:
- semi-transparent dark background
- white text
- small rounded panel
- no final visual polish needed


## Prompt Visibility

Prompt should:
- appear only when inside the trigger zone
- disappear when leaving the zone

## Interaction Result UI

When the player presses E in a valid trigger zone, show a placeholder building panel.

## Placement

Show the panel in the center of the screen.


## Example Content

Title:
Capy Store

Body:
This building will open the capy customization screen later.

## Panel Behavior

Preferred behavior:
Panel stays visible until closed.

Close key:
Escape
or
E

## Movement During Interaction

When the panel is open:
- capy movement should be disabled

When the panel closes:
- movement is enabled again

This prevents accidental movement during interaction.


## Initial Scope

Only buildings should be interactable in Step 05.

Do NOT add interaction for:
- trees
- rocks
- bushes
- paths

At least one building must work:
Capy Store

More buildings like Boutique, Bakery / House are optional.


## Suggested Technical Approach

A clean implementation could include:
- an array of interactable building definitions
- a function to test whether capy position is inside a trigger zone
- one variable like: activeInteractionTarget
- one UI element for the prompt
- one UI element or panel for the building message


## Things to Avoid

Do not:
- use fixed center-distance interaction
- use a single global radius for all buildings
- make trees or rocks interactable
- add final shop logic yet
- switch scenes yet
- add inventory or purchases yet

Focus only on the interaction framework.


## Acceptance Criteria

This step is complete only if all of the following are true:

1. At least one building is interactable.
2. A prompt appears only when the capy is inside the correct interaction zone.
3. The prompt text names the building correctly.
4. Pressing E triggers a visible placeholder building message or panel.
5. The message appears in a clear and consistent screen location.
6. The interaction does not trigger from far away.
7. Interaction remains stable for buildings of different sizes.
8. No console errors appear.


## Deliverable

A running local or deployed web app where the capy can approach at least one building, see a prompt, and press E to open a placeholder building interaction panel.

After implementation, provide:
- the URL
- a short summary of which building is interactable
- a screenshot or short screen recording showing:
    -- prompt appearing
    -- E interaction working
- any console errors if present

---

# My recommendation to the agent, in plain English

You can also send this short note with the markdown:

> Do not use distance-to-center interaction.  
> Create a specific invisible trigger zone in front of the building entrance.  
> Show the prompt at bottom-center of the screen, and show the interaction result as a centered modal panel.

---

# About the camera feeling zoomed in
You’re right, but leaving it for now is reasonable.

I would **not** mix camera retuning into Step 05 unless it becomes necessary for interaction readability.  
We can do a dedicated camera tuning step later, which is cleaner.
