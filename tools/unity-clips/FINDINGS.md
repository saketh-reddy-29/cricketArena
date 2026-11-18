# Unity cricket asset pack - findings (research notes)

Source: `Cricket_character_assets_extracted.zip`, exported from a Unity game's `datapack.unity3d`.
**Licensing: this is extracted from a commercial game package. Confirm you have the right to use it before shipping.**

## What is in the pack
| Part | Count | Usable as-is? |
|---|---|---|
| Animation clips (`animations/*.json`) | 629 files / 556 clips | Not directly: Unity *Humanoid muscle* clips, no bone curves |
| Meshes (`models/*.obj`) | 48 | Bats (0.94 m, 151 verts, UVs), balls, glove pairs. **No character body.** OBJ has no skin weights |
| Avatars (`rigs/avatars`) | ~47 | Yes: 94-bone hierarchy, T-pose, 51 humanoid bones with preQ/postQ/sign/limits |
| Controllers (`rigs/controllers`) | 25 | Show structure: one state per clip, no gameplay state machine |
| Textures | 41 | Bat / ball / kit textures |

## How the original game used them
* Pre-authored **timeline clips per role**, not a dynamic state machine: batsman 3-14 s clips, fielders `Shot1 -> Shot2 -> Shot3`
  (3.3 s, 4.0 s, 4.7 s), bowler 2.4-9.5 s, keeper stumping/celebration clips, separate `BallAnim_*` clips for the ball.
* One shared 94-bone humanoid avatar across roles (bone names such as `geo_Head_3`); left-handed batsman controllers reuse
  the same clips with a mirrored model.

## Clip encoding (decoded - `decode.py`)
`m_MuscleClip.m_Clip.data` = streamed (cubic keys `((x*dt+y)*dt+z)*dt+w`, first frame time = -FLT_MAX) + dense + constant curves.
`m_IndexArray` maps value slots -> curve index; slots 0-6 are root motion (-1). Value layout hypothesis (UNVERIFIED):
RootT 7-9, RootQ 10-13, 4 IK goals x (T3+Q4) 14-41, hands 42-81, **55 body muscles 82-136**.
Hips y = 0.93 m at slots 7-9 supports the layout; the muscle block was not yet validated.

## Open work to play these clips on our GLB characters
1. Validate the muscle block (slots 82-136) and muscle->bone-rotation order (preQ * R(angle*sgn) * postQ^-1, angle from limits).
2. FK on the avatar skeleton to get joint positions per frame.
3. Retarget to our GLB rig (aim-constraint per bone; our rest pose differs from the Unity T-pose).
4. Slice long timeline clips into actions and sync to the ball engine.
