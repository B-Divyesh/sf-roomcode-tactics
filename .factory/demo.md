# Demo sandbox

Open `https://roomcode-tactics.sociobot.in/demo` or use **Try it with sample
data** from the first screen.

The sample is an active five-turn Cypress Pass match: Mira is north, Teo is
south, and Teo holds position while the visitor chooses Mira’s moves. It has a
real board, scores, objectives, resolution messages, and an end screen.

The persistent **Demo — sample data, nothing is saved** banner exposes **Reset
demo** and **Start for real**. Demo state lives only in localStorage keys with
the `demo:roomcode-tactics:` prefix. The demo makes no request to the real
room-service API. Reset removes and recreates only this demo namespace; Start
for real discards it before returning to the real room flow.
