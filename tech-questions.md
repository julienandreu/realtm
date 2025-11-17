
PLAY -SDK-> API
API -> Create Task (DB)
API -> RTS (id)



PLAY -> RTS (inputs, workflowId)
RTS -> API (create task)
RTS -> Terminal (inputs, source_code)
Terminal -> RTS (breakpoints = run native)
RTS -> API (update task)
RTS -> Terminal (inputs, source_code)
Terminal -> RTS (outputs)
RTS -> API (finalize task)



OpenTracing?
    - API
    - Terminal*






A - B - C - D - stop(NATIVE(A,B)) - E(result) - F(output)

- A
- B
- C
- D
---- STOP
- E
- F


Runner 1 metatda Web
    - A
    - B
    - C
    - D
----STOP
-> Upload Context ABCD
-> Update Task


Runner 2
Load Task
Load Context
- NATIVE(A, B)
- E
- F
-> Upload Context metatdat Native
-> Update Task

---

Runner 1

- A
- B
- NATIVE(A, B)
- C
- D
    Stage Handler
    - Runner 2
    - Input A + B
    - NATIVE(A, B)
- E
- F



---

Entrypoint

-> Workflow
    ...core steps...
    -> Stage (backend | native | chrome) - Delegated agent run


---

Outlook Add-in (pure-frontend, no engine available) -> Realtime-server

WF (backend-runtime) -> Run outlook automation
Terminal (BE) -> RTS
RTS -> Outlook
Terminal (Outlook) run(no engine, just simple execPChrome(...))
Terminal (Outlook) -> RTS
RTS -> Terminal (BE)

---

REDIS
    - Stream (events)
    - 

S1

S2

Ta -> S1
Tb -> S2
Tc -> S2

S1
    - Ta


S2
    - Tb
    - Tc

### Disconnect S1

Ta -reconnect-> S2

S1(down)


S2
    - Tb
    - Tc
    - Ta


S1 -> reconnect

---

Terminal 1 -----> RTS

Entrypoint -----> API (start workflow)
API ----------> REDIS (on start workflow)

RTS (=======- REDIS (pull with block)
RTS --------> Terminal 1
Terminal 1 -> Engine RUN

Terminal 1 -----> API (update task: break workflow)
API ----------> REDIS (on continue workflow)

RTS (=======- REDIS (pull with block)
RTS --------> Terminal 2
Terminal 2 -> Engine RUN

Terminal 2 -----> API (update task) : DONE!
