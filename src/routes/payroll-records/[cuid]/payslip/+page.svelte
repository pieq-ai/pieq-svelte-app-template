<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { Button } from '$lib/components';
	import { toast } from '$lib/toast.svelte';
	const favicon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OTIiIGhlaWdodD0iNDkyIiB2aWV3Qm94PSIxNTAgMTQwIDE5MCAxOTAiPg0KPGc+DQo8cGF0aCBkPSJNIDI3OS42NCAyODAuNjQgQzI2Ni4xMCwyODkuMzEgMjUzLjE2LDI5MS42OCAyMzYuNTAsMjg4LjkyIEMyMzQuNjcsMjg4LjYyIDIzMi45NiwyODguMzIgMjMxLjM2LDI4OC4wMiBDMjQzLjQyLDI5MC4xMCAyNTYuMzQsMjg5LjEyIDI2OS40OSwyODUuMTMgQzI3Mi45MCwyODQuMDkgMjc2LjMyLDI4Mi41NyAyNzkuNjQsMjgwLjY0IFpNIDMxOC40NyAxOTEuNTAgQzMxNi44MiwxODguNTUgMzE1LjE0LDE4Ni4zMyAzMTMuNzgsMTg1LjUzIEMzMTEuNjcsMTg0LjI4IDMxMC45NiwxODMuMTggMzExLjE5LDE4MS40NiBDMzExLjQyLDE3OS43MiAzMDkuODQsMTc3LjU3IDMwNC4yMSwxNzIuMTEgQzMxMi40MCwxNzkuNzYgMzEzLjcwLDE4MS41MyAzMTcuOTksMTkwLjUwIEMzMTguMTUsMTkwLjgzIDMxOC4zMSwxOTEuMTYgMzE4LjQ3LDE5MS41MCBaTSAyMjcuMDAgMzAwLjg0IEMyMjEuNjUsMjk5LjczIDIxNi43MCwyOTguMTcgMjExLjk4LDI5Ni4wNiBDMjEyLjcxLDI5Ni4yOCAyMTMuNDgsMjk2LjQzIDIxNC4xOSwyOTYuNTAgQzIxOC44OSwyOTYuOTIgMjI1LjE5LDI5OC42OSAyMjUuOTAsMjk5Ljc5IEMyMjYuMTgsMzAwLjIyIDIyOC4wMywzMDAuOTIgMjMwLjI3LDMwMS40NiBDMjI5LjE5LDMwMS4yOCAyMjguMTAsMzAxLjA3IDIyNy4wMCwzMDAuODQgWk0gMzA5LjE5IDI0Ny4wMyBDMzA4LjE1LDI0OC4xNyAzMDUuMzgsMjUyLjUyIDMwMy4wMSwyNTYuNzQgQzI5OC44NCwyNjQuMTcgMjk2LjU2LDI2Ny4zMCAyOTEuMzYsMjcxLjgwIEMyOTUuNzQsMjY3LjYxIDI5OS41NywyNjIuNzggMzAyLjQ2LDI1Ny42MyBDMzA1LjA4LDI1Mi45NiAzMDguMDksMjQ4LjIxIDMwOS4xNSwyNDcuMDcgQzMwOS4xNiwyNDcuMDUgMzA5LjE4LDI0Ny4wNCAzMDkuMTksMjQ3LjAzIFpNIDIwOS4yMyAyOTQuNzUgQzIwMy4xOSwyOTEuNzIgMTk3LjQ3LDI4Ny43MiAxOTEuNjMsMjgyLjU0IEMxODguODksMjgwLjEwIDE4Ni41NSwyNzcuODEgMTg0LjUwLDI3NS41MSBDMTkwLjEyLDI4MS42MCAxOTguNDYsMjg4LjY5IDIwMy4wMywyOTAuOTkgQzIwNS40OSwyOTIuMjIgMjA4LjI2LDI5My45MCAyMDkuMTksMjk0LjcyIEMyMDkuMjAsMjk0LjczIDIwOS4yMSwyOTQuNzQgMjA5LjIzLDI5NC43NSBaTSAyMjYuODMgMjg3LjA4IEMyMTUuNjEsMjg0LjUzIDIxMC4wMywyODEuMjIgMjAwLjkyLDI3My4wNiBDMjA5Ljk3LDI4MS4xNiAyMTUuNjksMjg0LjMwIDIyNi4yNSwyODYuOTQgQzIyNi40NCwyODYuOTkgMjI2LjY0LDI4Ny4wNCAyMjYuODMsMjg3LjA4IFpNIDI4My40NiAxNTcuMjYgQzI3NC41NSwxNTIuODIgMjY0LjczLDE0OS45NSAyNTQuMzAsMTQ4LjgwIEMyNjQuOTksMTQ5Ljk4IDI3NC41NywxNTIuNzQgMjgzLjQ2LDE1Ny4yNiBaTSAyNDEuMTIgMzAyLjc1IEMyNDUuMDYsMzAyLjkxIDI0OS4yOSwzMDIuODcgMjUzLjA0LDMwMi42MSBDMjQ5LjE0LDMwMi45NCAyNDUuMTgsMzAyLjk5IDI0MS4xMiwzMDIuNzUgWk0gMTc4LjUwIDI2Ny40MiBDMTc2Ljc3LDI2NC41OSAxNzUuMjMsMjYxLjUyIDE3My43MSwyNTcuOTcgQzE3NC45OSwyNjAuOTYgMTc2LjgxLDI2NC41MiAxNzguNTAsMjY3LjQyIFpNIDI2My42MSAzMDAuOTYgQzI2Ny4zNywzMDAuMDcgMjcwLjk3LDI5OC45NiAyNzQuNDcsMjk3LjYxIEMyNzAuOTAsMjk5LjAwIDI2Ny4yOSwzMDAuMTIgMjYzLjYxLDMwMC45NiBaTSAzMjYuMTIgMjExLjU1IEMzMjUuNjMsMjEwLjc5IDMyNC43MSwyMDguMTQgMzI0LjAzLDIwNS41MCBDMzIzLjk2LDIwNS4yMiAzMjMuODksMjA0Ljk0IDMyMy44MSwyMDQuNjYgQzMyMy45MCwyMDQuOTcgMzIzLjk4LDIwNS4yNSAzMjQuMDUsMjA1LjUwIEMzMjQuNzEsMjA4LjE0IDMyNS42MywyMTAuNzkgMzI2LjEyLDIxMS41NSBaIiBmaWxsPSJyZ2JhKDIzNiw4NywyNSwxKSIvPg0KPHBhdGggZD0iTSAyMzEuNTAgMzAxLjc0IEMyMjguNzUsMzAxLjE4IDIyNi4yMywzMDAuMzAgMjI1LjkwLDI5OS43OSBDMjI1LjE5LDI5OC42OSAyMTguODksMjk2LjkyIDIxNC4xOSwyOTYuNTAgQzIxMi4zNywyOTYuMzMgMjEwLjEyLDI5NS41MyAyMDkuMTksMjk0LjcyIEMyMDguMjYsMjkzLjkwIDIwNS40OSwyOTIuMjIgMjAzLjAzLDI5MC45OSBDMTk3LjQwLDI4OC4xNSAxODYuMDQsMjc4LjA1IDE4MS4xMiwyNzEuNTAgQzE3OS4wNSwyNjguNzUgMTc1LjcyLDI2Mi42NiAxNzMuNzEsMjU3Ljk3IEMxNjQuMTIsMjM1LjUzIDE2NC42OCwyMTUuMDQgMTc1LjQ5LDE5Mi4zNiBDMTc5LjQxLDE4NC4xNCAxODEuMjksMTgxLjU4IDE4OS4yNywxNzMuNjIgQzE5OC43NywxNjQuMTQgMjA0LjQyLDE2MC42NCAyMTYuODUsMTU2LjU0IEMyMjMuMDUsMTU0LjQ5IDIyNi4yOSwxNTUuMzQgMjI4LjE4LDE1OS41MCBDMjI5LjE2LDE2MS42NSAyMjkuMDEsMTYyLjM2IDIyNy4xNiwxNjQuMzMgQzIyNS45NywxNjUuNjAgMjIyLjQ1LDE2Ny42OSAyMTkuMzQsMTY4Ljk4IEMyMDkuMzcsMTczLjExIDE5Ny41MiwxODEuOTMgMTkzLjE0LDE4OC40OSBDMTkxLjY2LDE5MC43MCAxODguNTYsMTk2LjMyIDE4Ni4yNSwyMDEuMDAgQzE4MC4xMSwyMTMuNDIgMTc5LjAwLDIyNi45MCAxODIuNzQsMjQ0LjAwIEMxODMuMTYsMjQ1LjkzIDE4NS44NiwyNTEuODYgMTg4Ljc1LDI1Ny4xOSBDMTkyLjkwLDI2NC44NCAxOTUuNDUsMjY4LjE3IDIwMC45MCwyNzMuMDUgQzIxMi4zMiwyODMuMjcgMjE4LjE5LDI4NS44OSAyMzYuNTAsMjg4LjkyIEMyNTYuMzQsMjkyLjIxIDI3MC45MSwyODguMjIgMjg3LjUwLDI3NC45NyBDMjk1LjY1LDI2OC40NyAyOTcuOTMsMjY1Ljc4IDMwMy4wMSwyNTYuNzQgQzMwNS40MSwyNTIuNDggMzA4LjIwLDI0OC4wOSAzMDkuMjIsMjQ2Ljk5IEMzMTEuNjksMjQ0LjM0IDMxNS4yOCwyNDQuNDggMzE4LjYyLDI0Ny4zNSBDMzIxLjI4LDI0OS42MyAzMjEuMzEsMjQ5LjgxIDMyMC4wNiwyNTQuMzAgQzMxOS4zNSwyNTYuODMgMzE3LjkyLDI1OS42NyAzMTYuODgsMjYwLjYwIEMzMTUuODUsMjYxLjU0IDMxNS4wMCwyNjIuOTYgMzE1LjAwLDI2My43NiBDMzE1LjAwLDI2Ni44MyAzMDUuMjYsMjc4LjMyIDI5Ny43MiwyODQuMTYgQzI4NS4zNCwyOTMuNzMgMjczLjYxLDI5OS4xNiAyNTkuNDQsMzAxLjg1IEMyNTIuMjIsMzAzLjIyIDIzOC40NywzMDMuMTcgMjMxLjUwLDMwMS43NCBaTSAzMTMuMzEgMjIwLjE2IEMzMTIuMDUsMjIxLjIwIDMwNS41NSwyMjEuNTMgMjg0LjEwLDIyMS42MiBDMjY4LjkyLDIyMS42OSAyNTUuNTUsMjIxLjM5IDI1NC4zOCwyMjAuOTUgQzI1My4yMSwyMjAuNTIgMjUxLjk1LDIxOC45NCAyNTEuNTgsMjE3LjQ0IEMyNTEuMjAsMjE1Ljk1IDI1MS4wMCwyMDIuNjAgMjUxLjEyLDE4Ny43NyBMIDI1MS4zNSAxNjAuODIgTCAyNTMuOTIgMTU5Ljg0IEMyNTcuMTgsMTU4LjU5IDI2My42NSwxNTkuNTMgMjY4LjA4LDE2MS44OSBDMjY5Ljk2LDE2Mi44OSAyNzMuMjksMTY0LjI5IDI3NS40NywxNjUuMDAgQzI3Ny42NiwxNjUuNzIgMjgwLjA1LDE2Ni45MSAyODAuNzksMTY3LjY1IEMyODEuNTMsMTY4LjM5IDI4NC4yNSwxNzAuMjIgMjg2LjgyLDE3MS43MSBDMjg5LjM5LDE3My4yMCAyOTEuNjQsMTc0Ljc1IDI5MS44MSwxNzUuMTQgQzI5MS45OCwxNzUuNTMgMjk0LjYyLDE3OC40NyAyOTcuNjgsMTgxLjY4IEMzMDAuNzQsMTg0Ljg4IDMwMy44NywxODguODUgMzA0LjY0LDE5MC41MCBDMzA1LjQwLDE5Mi4xNSAzMDYuNDIsMTk0LjE4IDMwNi44OSwxOTUuMDAgQzMwOS42NCwxOTkuODAgMzEyLjAwLDIwNC45NiAzMTIuMDAsMjA2LjE3IEMzMTIuMDAsMjA2Ljk1IDMxMi45MCwyMDkuMzQgMzE0LjAwLDIxMS41MCBDMzE2LjEyLDIxNS42NiAzMTUuOTQsMjE3Ljk4IDMxMy4zMSwyMjAuMTYgWk0gMzEyLjcxIDIxOS4yMCBDMzE1LjMxLDIxNy41NSAzMDkuMjQsMjAwLjY3IDMwMi41NCwxOTAuOTEgQzI5OC4yNSwxODQuNjUgMjg5LjMyLDE3NS4wMCAyODcuODEsMTc1LjAwIEMyODcuMjUsMTc1LjAwIDI4NS4zNywxNzMuODAgMjgzLjY0LDE3Mi4zNCBDMjgxLjkxLDE3MC44OCAyNzguMDIsMTY4LjYyIDI3NS4wMCwxNjcuMzEgQzI3MS45OCwxNjYuMDAgMjY4LjYwLDE2NC41MyAyNjcuNTAsMTY0LjA1IEMyNjIuODIsMTYxLjk4IDI1OC42MSwxNjEuMDYgMjU2LjM4LDE2MS42MiBMIDI1NC4wMCAxNjIuMjIgTCAyNTMuOTIgMTgzLjg2IEMyNTMuODEsMjEyLjczIDI1My45OCwyMTcuMjcgMjU1LjIwLDIxOC43NCBDMjU1Ljk5LDIxOS43MCAyNjIuOTEsMjIwLjAwIDI4My44NywyMTkuOTggQzI5OS4wNywyMTkuOTggMzEyLjA1LDIxOS42MiAzMTIuNzEsMjE5LjIwIFpNIDIzMS41MCAyOTkuMDAgQzIzNS45MCwyOTkuOTEgMjU2LjQ2LDI5OS41OCAyNjIuMDAsMjk4LjUxIEMyNjMuOTIsMjk4LjE0IDI2Ni45MiwyOTcuMTkgMjY4LjY1LDI5Ni40MiBDMjcwLjM4LDI5NS42NCAyNzIuOTQsMjk1LjAwIDI3NC4zMiwyOTUuMDAgQzI3Ni45MywyOTUuMDAgMjk0LjAwLDI4NS4zOSAyOTQuMDAsMjgzLjkyIEMyOTQuMDAsMjgzLjQ3IDI5Ni4wMywyODEuNzAgMjk4LjUwLDI4MC4wMCBDMzAwLjk4LDI3OC4zMCAzMDQuMTksMjc1LjgwIDMwNS42NSwyNzQuNDUgQzMwNy4xMCwyNzMuMTAgMzA4Ljc1LDI3Mi4wMCAzMDkuMzEsMjcyLjAwIEMzMDkuODcsMjcyLjAwIDMxMC4wNSwyNzEuNzIgMzA5LjcxLDI3MS4zOCBDMzA5LjM3LDI3MS4wMyAzMDkuOTcsMjY5LjAzIDMxMS4wNCwyNjYuOTIgQzMxMi4xMiwyNjQuODEgMzEzLjAwLDI2Mi40NCAzMTMuMDAsMjYxLjY2IEMzMTMuMDAsMjYwLjg4IDMxMy43NCwyNTkuNjMgMzE0LjY1LDI1OC44NyBDMzE3LjMwLDI1Ni42OCAzMTkuMjIsMjUxLjIxIDMxOC4wNiwyNDkuMjEgQzMxNy41MSwyNDguMjcgMzE3LjA1LDI0Ny44NSAzMTcuMDMsMjQ4LjI5IEMzMTcuMDEsMjQ4LjcyIDMxNi4xMywyNDguNjEgMzE1LjA3LDI0OC4wNCBDMzEyLjExLDI0Ni40NSAzMTAuMzgsMjQ3LjcwIDMwOC4wNiwyNTMuMDcgQzMwNi45MCwyNTUuNzggMzA1LjQ5LDI1OC4wMCAzMDQuOTQsMjU4LjAwIEMzMDQuMzgsMjU4LjAwIDMwMy4xMSwyNTkuOTIgMzAyLjEwLDI2Mi4yNyBDMzAwLjEzLDI2Ni44NyAyOTMuMzksMjc1LjAwIDI5MS41NCwyNzUuMDAgQzI5MC45MiwyNzUuMDAgMjg3Ljk4LDI3Ny4yNSAyODUuMDAsMjgwLjAwIEMyODEuNDAsMjgzLjMzIDI3OC43MiwyODUuMDAgMjc2Ljk5LDI4NS4wMCBDMjc1LjU3LDI4NS4wMCAyNzMuOTMsMjg1LjQ3IDI3My4zNSwyODYuMDUgQzI3Mi43OCwyODYuNjIgMjY4Ljk0LDI4Ny45MiAyNjQuODIsMjg4LjkyIEMyNjAuNzEsMjg5LjkyIDI1Ni40NSwyOTEuMjIgMjU1LjM2LDI5MS44MCBDMjUzLjE4LDI5Mi45NyAyMzguODYsMjkxLjkxIDIzMy4yOSwyOTAuMTcgQzIzMS41MywyODkuNjIgMjI5LjE3LDI4OS40MCAyMjguMDUsMjg5LjcwIEMyMjYuOTMsMjg5Ljk5IDIyNC40OCwyODkuNTAgMjIyLjYwLDI4OC42MiBDMjIwLjczLDI4Ny43MyAyMTguNTksMjg2Ljk5IDIxNy44NSwyODYuOTggQzIxNy4xMSwyODYuOTcgMjE1LjM4LDI4Ni4wOCAyMTQuMDAsMjg1LjAwIEMyMTIuNjIsMjgzLjkyIDIxMC43NywyODMuMDMgMjA5Ljg5LDI4My4wMiBDMjA4LjE3LDI4My4wMCAyMDEuODAsMjc4LjU1IDE5OC41MCwyNzUuMDYgQzE5Ny40MCwyNzMuOTAgMTk1LjM1LDI3MS43MyAxOTMuOTQsMjcwLjIzIEMxOTEuMTcsMjY3LjI4IDE4OC44NCwyNjMuMzAgMTg3LjA0LDI1OC40MSBDMTg2LjQxLDI1Ni43MiAxODQuNTEsMjUzLjgyIDE4Mi44MywyNTEuOTcgQzE3OS43OCwyNDguNjMgMTc5Ljc2LDI0OC41NSAxODAuNDIsMjQwLjQzIEMxODAuOTksMjMzLjM2IDE4MC44NiwyMzIuMTYgMTc5LjQzLDIzMS42MSBDMTc4LjA1LDIzMS4wOCAxNzcuODQsMjI5Ljc1IDE3OC4xNywyMjMuMzEgQzE3OC4zOCwyMTkuMTAgMTc5LjAxLDIxNS41MCAxNzkuNTUsMjE1LjMyIEMxODAuMTAsMjE1LjEzIDE4MC4zOCwyMTMuMjAgMTgwLjE3LDIxMS4wMyBDMTc5LjkwLDIwOC4xMiAxODAuMzUsMjA2LjM3IDE4MS45MCwyMDQuNDAgQzE4My4wNSwyMDIuOTMgMTg0LjAwLDIwMC43NCAxODQuMDAsMTk5LjUyIEMxODQuMDAsMTk4LjMwIDE4NC44OSwxOTYuNTEgMTg1Ljk4LDE5NS41MiBDMTg3LjA2LDE5NC41NCAxODcuNzQsMTkzLjQwIDE4Ny40OSwxOTIuOTggQzE4Ny4yNCwxOTIuNTcgMTg3LjkyLDE5MS4xMCAxODkuMDEsMTg5LjcxIEMxOTAuMTEsMTg4LjMyIDE5MS4wMCwxODYuODUgMTkxLjAwLDE4Ni40NCBDMTkxLjAwLDE4NS4zMSAxOTguOTIsMTc4LjE5IDIwNC4wMCwxNzQuNzUgQzIwNi40OCwxNzMuMDcgMjA5LjQwLDE3MC45NCAyMTAuNTAsMTcwLjAyIEMyMTEuNjAsMTY5LjEwIDIxNC41MiwxNjcuNzYgMjE3LjAwLDE2Ny4wNiBDMjIxLjczLDE2NS43MSAyMjcuMDAsMTYyLjQ5IDIyNy4wMCwxNjAuOTUgQzIyNy4wMCwxNjAuNDYgMjI1Ljk1LDE1OS4zNiAyMjQuNjcsMTU4LjUyIEMyMjEuMTYsMTU2LjIyIDIxNS45OCwxNTguMTggMjE2LjYwLDE2MS41NyBDMjE2Ljg0LDE2Mi45MSAyMTYuNTgsMTY0LjAwIDIxNi4wMiwxNjQuMDAgQzIxNS40NiwxNjQuMDAgMjE1LjAwLDE2My4xMCAyMTUuMDAsMTYyLjAwIEMyMTUuMDAsMTU4Ljk4IDIxMi44MSwxNTkuNTIgMjAzLjE5LDE2NC45NSBDMTk2LjM1LDE2OC44MCAxOTMuOTYsMTcwLjc0IDE5Mi40MCwxNzMuNzAgQzE5MC45NSwxNzYuNDYgMTg5LjYwLDE3Ny42NCAxODcuNDUsMTc4LjAwIEMxODUuNDAsMTc4LjM2IDE4NC40MSwxNzkuMTcgMTg0LjE5LDE4MC42NSBDMTg0LjAzLDE4MS44MyAxODMuMDEsMTgzLjU4IDE4MS45NCwxODQuNTUgQzE4MC44NywxODUuNTIgMTc5Ljk5LDE4Ny4wMyAxNzkuOTcsMTg3LjkwIEMxNzkuOTUsMTg4Ljc4IDE3OC44NSwxOTEuMjggMTc3LjUxLDE5My40NSBDMTc1LjcxLDE5Ni4zNyAxNzUuMzcsMTk3Ljc0IDE3Ni4xNywxOTguNzAgQzE3Ni45NCwxOTkuNjMgMTc2LjkzLDIwMC4wMCAxNzYuMTQsMjAwLjAwIEMxNzIuOTQsMjAwLjAwIDE2OC43MSwyMTUuNDkgMTY4LjkxLDIyNi41MCBDMTY5LjA2LDIzNC42MiAxNzEuMzIsMjQ2LjY2IDE3My42OSwyNTIuMDAgQzE3NS4wNCwyNTUuMDIgMTc3LjA0LDI1OS41MiAxNzguMTMsMjYyLjAwIEMxNzkuMjMsMjY0LjQ4IDE4MC41NSwyNjcuMTcgMTgxLjA4LDI2OC4wMCBDMTg0LjYyLDI3My41OCAxODYuMTAsMjc1LjI5IDE4OS41OCwyNzcuODUgQzE5MS43NCwyNzkuNDMgMTk0LjcwLDI4MS44NiAxOTYuMTgsMjgzLjI1IEMxOTcuNjUsMjg0LjYzIDIwMS4zMSwyODcuMTcgMjA0LjMxLDI4OC44OSBDMjA3LjMxLDI5MC42MSAyMTAuMzIsMjkyLjY4IDIxMS4wMCwyOTMuNTAgQzIxMS42NywyOTQuMzEgMjEyLjY3LDI5NC43MCAyMTMuMjEsMjk0LjM3IEMyMTMuNzUsMjk0LjA0IDIxNS4xNiwyOTQuMjMgMjE2LjM1LDI5NC44MCBDMjE4LjY1LDI5NS45MCAyMjQuOTksMjk3LjY2IDIzMS41MCwyOTkuMDAgWk0gMjk1LjE0IDE2NC4zOCBDMjk4LjAyLDE2Ni40OSAzMDAuNzgsMTY4LjgwIDMwMy4zOCwxNzEuMzEgQzMwOS42OCwxNzcuMzcgMzExLjQzLDE3OS42NCAzMTEuMTksMTgxLjQ2IEMzMTAuOTYsMTgzLjE4IDMxMS42NywxODQuMjggMzEzLjc4LDE4NS41MyBDMzE2Ljk1LDE4Ny40MCAzMjEuODQsMTk2LjkzIDMyNC4wMywyMDUuNTAgQzMyNC43MywyMDguMjUgMzI1LjcwLDIxMS4wMSAzMjYuMTgsMjExLjYzIEMzMjYuNjYsMjEyLjI2IDMyNy4wMywyMTQuMDYgMzI3LjAwLDIxNS42MyBDMzI2Ljk3LDIxNy4yMSAzMjcuMjMsMjIwLjk4IDMyNy41NiwyMjQuMDAgQzMyOC4wOSwyMjguNzMgMzI3Ljg4LDIyOS44MSAzMjYuMDUsMjMxLjc1IEwgMzIzLjkyIDIzNC4wMCBMIDI4My41MCAyMzQuMDAgQzI2Mi44MSwyMzQuMDAgMjUyLjY5LDIzMy45OCAyNDcuNTksMjMzLjY4IEMyNDcuODgsMjMzLjQ5IDI0OC4xMSwyMzMuMTggMjQ4LjI1LDIzMi43NSBDMjQ4LjU3LDIzMS43OCAyNTYuMzIsMjMxLjUwIDI4Mi41MCwyMzEuNTAgQzMwOC42OCwyMzEuNTAgMzE2LjQzLDIzMS43OCAzMTYuNzUsMjMyLjc1IEMzMTcuNDYsMjM0Ljg5IDMyMC43NCwyMzQuMTMgMzI0LjEyLDIzMS4wNCBDMzI3LjE0LDIyOC4yOCAzMjcuMjcsMjI3LjkwIDMyNi4wNywyMjUuMjkgQzMyNS4zNiwyMjMuNzYgMzI0LjM5LDIxOS44MCAzMjMuOTEsMjE2LjUwIEMzMjEuODIsMjAxLjk1IDMxNS43MywxODcuODAgMzEwLjgyLDE4Ni4wOSBDMzA4LjY5LDE4NS4zNSAzMDcuOTYsMTg0LjU3IDMwOC4zOSwxODMuNTEgQzMwOC43MiwxODIuNjggMzA5LjI3LDE4MS4zMyAzMDkuNjAsMTgwLjUxIEMzMDkuOTksMTc5LjU1IDMwOS4zOCwxNzguNzEgMzA3Ljg1LDE3OC4xMiBDMzAzLjc4LDE3Ni41NCAyOTQuODAsMTY3LjU1IDI5NS4xNywxNjUuNDIgQzI5NS4yNCwxNjUuMDAgMjk1LjI1LDE2NC42NiAyOTUuMTQsMTY0LjM4IFpNIDI0Mi4wNCAyMzIuMDcgQzI0MS4zNywyMzAuODMgMjQxLjAwLDIxNS44MSAyNDEuMDAsMTkwLjE5IEMyNDEuMDAsMTcxLjE2IDI0MS4wNiwxNjAuOTUgMjQxLjMzLDE1NS40MiBDMjQxLjQ1LDE1NS43NSAyNDEuNjQsMTU2LjA3IDI0MS45MiwxNTYuNDAgQzI0Mi44MywxNTcuNTAgMjQzLjA4LDE2Ni45MiAyNDIuOTEsMTk0LjMxIEMyNDIuNzIsMjI0LjQ2IDI0Mi45MywyMzEuMDIgMjQ0LjA5LDIzMi4zMyBDMjQ0LjU1LDIzMi44NiAyNDUuMDMsMjMzLjI1IDI0NS40OSwyMzMuNTIgQzI0Mi44OCwyMzMuMjMgMjQyLjQyLDIzMi43OCAyNDIuMDQsMjMyLjA3IFpNIDI0MS40NiAxNTMuNDAgQzI0MS42OSwxNTAuNDEgMjQyLjA0LDE0OS4zOSAyNDIuNTUsMTQ4Ljk2IEMyNDMuNzgsMTQ3Ljk0IDI0Ni4xNSwxNDcuOTEgMjU0LjMwLDE0OC44MCBDMjY5LjAzLDE1MC40MyAyODIuNTMsMTU1LjQ2IDI5My45OCwxNjMuNTUgQzI5My4yMywxNjMuMzIgMjkyLjA2LDE2My4xNSAyOTAuMzEsMTYyLjk4IEMyODYuODEsMTYyLjYzIDI4NC4zMywxNjEuNzIgMjgyLjcxLDE2MC4yMCBDMjgwLjMzLDE1Ny45NiAyNzQuNzUsMTU1LjUyIDI2My44NCwxNTEuOTYgQzI1Ny42OCwxNDkuOTUgMjUyLjI1LDE1MC42MSAyNDkuMTEsMTUzLjc1IEMyNDcuNjksMTU1LjE3IDI0Ny40OSwxNTUuMDkgMjQ2Ljk4LDE1Mi45MSBDMjQ2LjE5LDE0OS41NiAyNDMuMjksMTQ5LjI3IDI0MS44NiwxNTIuNDAgQzI0MS43MCwxNTIuNzcgMjQxLjU2LDE1My4xMCAyNDEuNDYsMTUzLjQwIFpNIDI4OS4wMCAxNjcuMDYgQzI4OS4wMCwxNjcuNTggMjg4LjU1LDE2OC4wMCAyODguMDAsMTY4LjAwIEMyODcuNDUsMTY4LjAwIDI4Ny4wMCwxNjcuMzAgMjg3LjAwLDE2Ni40NCBDMjg3LjAwLDE2NS41OCAyODcuNDUsMTY1LjE2IDI4OC4wMCwxNjUuNTAgQzI4OC41NSwxNjUuODQgMjg5LjAwLDE2Ni41NCAyODkuMDAsMTY3LjA2IFpNIDE5MC4wMCAyNzEuMDAgQzE5MC4wMCwyNzEuNTUgMTg5LjU1LDI3Mi4wMCAxODkuMDAsMjcyLjAwIEMxODguNDUsMjcyLjAwIDE4OC4wMCwyNzEuNTUgMTg4LjAwLDI3MS4wMCBDMTg4LjAwLDI3MC40NSAxODguNDUsMjcwLjAwIDE4OS4wMCwyNzAuMDAgQzE4OS41NSwyNzAuMDAgMTkwLjAwLDI3MC40NSAxOTAuMDAsMjcxLjAwIFoiIGZpbGw9InJnYmEoMjQwLDg0LDE5LDEpIi8+DQo8cGF0aCBkPSJNIDIzMS41MCAyOTkuMDAgQzIyNC45OSwyOTcuNjYgMjE4LjY1LDI5NS45MCAyMTYuMzUsMjk0LjgwIEMyMTUuMTYsMjk0LjIzIDIxMy43NSwyOTQuMDQgMjEzLjIxLDI5NC4zNyBDMjEyLjY3LDI5NC43MCAyMTEuNjcsMjk0LjMxIDIxMS4wMCwyOTMuNTAgQzIxMC4zMiwyOTIuNjggMjA3LjMxLDI5MC42MSAyMDQuMzEsMjg4Ljg5IEMyMDEuMzEsMjg3LjE3IDE5Ny42NSwyODQuNjMgMTk2LjE4LDI4My4yNSBDMTk0LjcwLDI4MS44NiAxOTEuNzQsMjc5LjQzIDE4OS41OCwyNzcuODUgQzE4Ni4xMCwyNzUuMjkgMTg0LjYyLDI3My41OCAxODEuMDgsMjY4LjAwIEMxODAuNTUsMjY3LjE3IDE3OS4yMywyNjQuNDggMTc4LjEzLDI2Mi4wMCBDMTc3LjA0LDI1OS41MiAxNzUuMDQsMjU1LjAyIDE3My42OSwyNTIuMDAgQzE3MS4zMiwyNDYuNjYgMTY5LjA2LDIzNC42MiAxNjguOTEsMjI2LjUwIEMxNjguNzEsMjE1LjQ5IDE3Mi45NCwyMDAuMDAgMTc2LjE0LDIwMC4wMCBDMTc2LjkzLDIwMC4wMCAxNzYuOTQsMTk5LjYzIDE3Ni4xNywxOTguNzAgQzE3NS4zNywxOTcuNzQgMTc1LjcxLDE5Ni4zNyAxNzcuNTEsMTkzLjQ1IEMxNzguODUsMTkxLjI4IDE3OS45NSwxODguNzggMTc5Ljk3LDE4Ny45MCBDMTc5Ljk5LDE4Ny4wMyAxODAuODcsMTg1LjUyIDE4MS45NCwxODQuNTUgQzE4My4wMSwxODMuNTggMTg0LjAzLDE4MS44MyAxODQuMTksMTgwLjY1IEMxODQuNDEsMTc5LjE3IDE4NS40MCwxNzguMzYgMTg3LjQ1LDE3OC4wMCBDMTg5LjYwLDE3Ny42NCAxOTAuOTUsMTc2LjQ2IDE5Mi40MCwxNzMuNzAgQzE5My45NiwxNzAuNzQgMTk2LjM1LDE2OC44MCAyMDMuMTksMTY0Ljk1IEMyMTIuODEsMTU5LjUyIDIxNS4wMCwxNTguOTggMjE1LjAwLDE2Mi4wMCBDMjE1LjAwLDE2My4xMCAyMTUuNDYsMTY0LjAwIDIxNi4wMiwxNjQuMDAgQzIxNi41OCwxNjQuMDAgMjE2Ljg0LDE2Mi45MSAyMTYuNjAsMTYxLjU3IEMyMTUuOTgsMTU4LjE4IDIyMS4xNiwxNTYuMjIgMjI0LjY3LDE1OC41MiBDMjI1Ljk1LDE1OS4zNiAyMjcuMDAsMTYwLjQ2IDIyNy4wMCwxNjAuOTUgQzIyNy4wMCwxNjIuNDkgMjIxLjczLDE2NS43MSAyMTcuMDAsMTY3LjA2IEMyMTQuNTIsMTY3Ljc2IDIxMS42MCwxNjkuMTAgMjEwLjUwLDE3MC4wMiBDMjA5LjQwLDE3MC45NCAyMDYuNDgsMTczLjA3IDIwNC4wMCwxNzQuNzUgQzE5OC45MiwxNzguMTkgMTkxLjAwLDE4NS4zMSAxOTEuMDAsMTg2LjQ0IEMxOTEuMDAsMTg2Ljg1IDE5MC4xMSwxODguMzIgMTg5LjAxLDE4OS43MSBDMTg3LjkyLDE5MS4xMCAxODcuMjQsMTkyLjU3IDE4Ny40OSwxOTIuOTggQzE4Ny43NCwxOTMuNDAgMTg3LjA2LDE5NC41NCAxODUuOTgsMTk1LjUyIEMxODQuODksMTk2LjUxIDE4NC4wMCwxOTguMzAgMTg0LjAwLDE5OS41MiBDMTg0LjAwLDIwMC43NCAxODMuMDUsMjAyLjkzIDE4MS45MCwyMDQuNDAgQzE4MC4zNSwyMDYuMzcgMTc5LjkwLDIwOC4xMiAxODAuMTcsMjExLjAzIEMxODAuMzgsMjEzLjIwIDE4MC4xMCwyMTUuMTMgMTc5LjU1LDIxNS4zMiBDMTc5LjAxLDIxNS41MCAxNzguMzgsMjE5LjEwIDE3OC4xNywyMjMuMzEgQzE3Ny44NCwyMjkuNzUgMTc4LjA1LDIzMS4wOCAxNzkuNDMsMjMxLjYxIEMxODAuODYsMjMyLjE2IDE4MC45OSwyMzMuMzYgMTgwLjQyLDI0MC40MyBDMTc5Ljc2LDI0OC41NSAxNzkuNzgsMjQ4LjYzIDE4Mi44MywyNTEuOTcgQzE4NC41MSwyNTMuODIgMTg2LjQxLDI1Ni43MiAxODcuMDQsMjU4LjQxIEMxODguODQsMjYzLjMwIDE5MS4xNywyNjcuMjggMTkzLjk0LDI3MC4yMyBDMTk1LjM1LDI3MS43MyAxOTcuNDAsMjczLjkwIDE5OC41MCwyNzUuMDYgQzIwMS44MCwyNzguNTUgMjA4LjE3LDI4My4wMCAyMDkuODksMjgzLjAyIEMyMTAuNzcsMjgzLjAzIDIxMi42MiwyODMuOTIgMjE0LjAwLDI4NS4wMCBDMjE1LjM4LDI4Ni4wOCAyMTcuMTEsMjg2Ljk3IDIxNy44NSwyODYuOTggQzIxOC41OSwyODYuOTkgMjIwLjczLDI4Ny43MyAyMjIuNjAsMjg4LjYyIEMyMjQuNDgsMjg5LjUwIDIyNi45MywyODkuOTkgMjI4LjA1LDI4OS43MCBDMjI5LjE3LDI4OS40MCAyMzEuNTMsMjg5LjYyIDIzMy4yOSwyOTAuMTcgQzIzOC44NiwyOTEuOTEgMjUzLjE4LDI5Mi45NyAyNTUuMzYsMjkxLjgwIEMyNTYuNDUsMjkxLjIyIDI2MC43MSwyODkuOTIgMjY0LjgyLDI4OC45MiBDMjY4Ljk0LDI4Ny45MiAyNzIuNzgsMjg2LjYyIDI3My4zNSwyODYuMDUgQzI3My45MywyODUuNDcgMjc1LjU3LDI4NS4wMCAyNzYuOTksMjg1LjAwIEMyNzguNzIsMjg1LjAwIDI4MS40MCwyODMuMzMgMjg1LjAwLDI4MC4wMCBDMjg3Ljk4LDI3Ny4yNSAyOTAuOTIsMjc1LjAwIDI5MS41NCwyNzUuMDAgQzI5My4zOSwyNzUuMDAgMzAwLjEzLDI2Ni44NyAzMDIuMTAsMjYyLjI3IEMzMDMuMTEsMjU5LjkyIDMwNC4zOCwyNTguMDAgMzA0Ljk0LDI1OC4wMCBDMzA1LjQ5LDI1OC4wMCAzMDYuOTAsMjU1Ljc4IDMwOC4wNiwyNTMuMDcgQzMxMC4zOCwyNDcuNzAgMzEyLjExLDI0Ni40NSAzMTUuMDcsMjQ4LjA0IEMzMTYuMTMsMjQ4LjYxIDMxNy4wMSwyNDguNzIgMzE3LjAzLDI0OC4yOSBDMzE3LjA1LDI0Ny44NSAzMTcuNTEsMjQ4LjI3IDMxOC4wNiwyNDkuMjEgQzMxOS4yMiwyNTEuMjEgMzE3LjMwLDI1Ni42OCAzMTQuNjUsMjU4Ljg3IEMzMTMuNzQsMjU5LjYzIDMxMy4wMCwyNjAuODggMzEzLjAwLDI2MS42NiBDMzEzLjAwLDI2Mi40NCAzMTIuMTIsMjY0LjgxIDMxMS4wNCwyNjYuOTIgQzMwOS45NywyNjkuMDMgMzA5LjM3LDI3MS4wMyAzMDkuNzEsMjcxLjM4IEMzMTAuMDUsMjcxLjcyIDMwOS44NywyNzIuMDAgMzA5LjMxLDI3Mi4wMCBDMzA4Ljc1LDI3Mi4wMCAzMDcuMTAsMjczLjEwIDMwNS42NSwyNzQuNDUgQzMwNC4xOSwyNzUuODAgMzAwLjk4LDI3OC4zMCAyOTguNTAsMjgwLjAwIEMyOTYuMDMsMjgxLjcwIDI5NC4wMCwyODMuNDcgMjk0LjAwLDI4My45MiBDMjk0LjAwLDI4NS4zOSAyNzYuOTMsMjk1LjAwIDI3NC4zMiwyOTUuMDAgQzI3Mi45NCwyOTUuMDAgMjcwLjM4LDI5NS42NCAyNjguNjUsMjk2LjQyIEMyNjYuOTIsMjk3LjE5IDI2My45MiwyOTguMTQgMjYyLjAwLDI5OC41MSBDMjU2LjQ2LDI5OS41OCAyMzUuOTAsMjk5LjkxIDIzMS41MCwyOTkuMDAgWk0gMTkwLjAwIDI3MS4wMCBDMTkwLjAwLDI3MC40NSAxODkuNTUsMjcwLjAwIDE4OS4wMCwyNzAuMDAgQzE4OC40NSwyNzAuMDAgMTg4LjAwLDI3MC40NSAxODguMDAsMjcxLjAwIEMxODguMDAsMjcxLjU1IDE4OC40NSwyNzIuMDAgMTg5LjAwLDI3Mi4wMCBDMTg5LjU1LDI3Mi4wMCAxOTAuMDAsMjcxLjU1IDE5MC4wMCwyNzEuMDAgWk0gMjQ0LjA5IDIzMi4zMyBDMjQyLjkzLDIzMS4wMiAyNDIuNzIsMjI0LjQ2IDI0Mi45MSwxOTQuMzEgQzI0My4wOCwxNjYuOTIgMjQyLjgzLDE1Ny41MCAyNDEuOTIsMTU2LjQwIEMyNDAuOTksMTU1LjI4IDI0MC45OCwxNTQuMzUgMjQxLjg2LDE1Mi40MCBDMjQzLjI5LDE0OS4yNyAyNDYuMTksMTQ5LjU2IDI0Ni45OCwxNTIuOTEgQzI0Ny40OSwxNTUuMDkgMjQ3LjY5LDE1NS4xNyAyNDkuMTEsMTUzLjc1IEMyNTIuMjUsMTUwLjYxIDI1Ny42OCwxNDkuOTUgMjYzLjg0LDE1MS45NiBDMjc0Ljc1LDE1NS41MiAyODAuMzMsMTU3Ljk2IDI4Mi43MSwxNjAuMjAgQzI4NC4zMywxNjEuNzIgMjg2LjgxLDE2Mi42MyAyOTAuMzEsMTYyLjk4IEMyOTQuNzQsMTYzLjQyIDI5NS40NSwxNjMuNzggMjk1LjE3LDE2NS40MiBDMjk0LjgwLDE2Ny41NSAzMDMuNzgsMTc2LjU0IDMwNy44NSwxNzguMTIgQzMwOS4zOCwxNzguNzEgMzA5Ljk5LDE3OS41NSAzMDkuNjAsMTgwLjUxIEMzMDkuMjcsMTgxLjMzIDMwOC43MiwxODIuNjggMzA4LjM5LDE4My41MSBDMzA3Ljk2LDE4NC41NyAzMDguNjksMTg1LjM1IDMxMC44MiwxODYuMDkgQzMxNS43MywxODcuODAgMzIxLjgyLDIwMS45NSAzMjMuOTEsMjE2LjUwIEMzMjQuMzksMjE5LjgwIDMyNS4zNiwyMjMuNzYgMzI2LjA3LDIyNS4yOSBDMzI3LjI3LDIyNy45MCAzMjcuMTQsMjI4LjI4IDMyNC4xMiwyMzEuMDQgQzMyMC43NCwyMzQuMTMgMzE3LjQ2LDIzNC44OSAzMTYuNzUsMjMyLjc1IEMzMTYuNDMsMjMxLjc4IDMwOC42OCwyMzEuNTAgMjgyLjUwLDIzMS41MCBDMjU2LjMyLDIzMS41MCAyNDguNTcsMjMxLjc4IDI0OC4yNSwyMzIuNzUgQzI0Ny42OCwyMzQuNDUgMjQ1LjgwLDIzNC4yNiAyNDQuMDksMjMyLjMzIFpNIDMxMy4zMSAyMjAuMTYgQzMxNS45NCwyMTcuOTggMzE2LjEyLDIxNS42NiAzMTQuMDAsMjExLjUwIEMzMTIuOTAsMjA5LjM0IDMxMi4wMCwyMDYuOTUgMzEyLjAwLDIwNi4xNyBDMzEyLjAwLDIwNC45NiAzMDkuNjQsMTk5LjgwIDMwNi44OSwxOTUuMDAgQzMwNi40MiwxOTQuMTggMzA1LjQwLDE5Mi4xNSAzMDQuNjQsMTkwLjUwIEMzMDMuODcsMTg4Ljg1IDMwMC43NCwxODQuODggMjk3LjY4LDE4MS42OCBDMjk0LjYyLDE3OC40NyAyOTEuOTgsMTc1LjUzIDI5MS44MSwxNzUuMTQgQzI5MS42NCwxNzQuNzUgMjg5LjM5LDE3My4yMCAyODYuODIsMTcxLjcxIEMyODQuMjUsMTcwLjIyIDI4MS41MywxNjguMzkgMjgwLjc5LDE2Ny42NSBDMjgwLjA1LDE2Ni45MSAyNzcuNjYsMTY1LjcyIDI3NS40NywxNjUuMDAgQzI3My4yOSwxNjQuMjkgMjY5Ljk2LDE2Mi44OSAyNjguMDgsMTYxLjg5IEMyNjMuNjUsMTU5LjUzIDI1Ny4xOCwxNTguNTkgMjUzLjkyLDE1OS44NCBMIDI1MS4zNSAxNjAuODIgTCAyNTEuMTIgMTg3Ljc3IEMyNTEuMDAsMjAyLjYwIDI1MS4yMCwyMTUuOTUgMjUxLjU4LDIxNy40NCBDMjUxLjk1LDIxOC45NCAyNTMuMjEsMjIwLjUyIDI1NC4zOCwyMjAuOTUgQzI1NS41NSwyMjEuMzkgMjY4LjkyLDIyMS42OSAyODQuMTAsMjIxLjYyIEMzMDUuNTUsMjIxLjUzIDMxMi4wNSwyMjEuMjAgMzEzLjMxLDIyMC4xNiBaTSAyODkuMDAgMTY3LjA2IEMyODkuMDAsMTY2LjU0IDI4OC41NSwxNjUuODQgMjg4LjAwLDE2NS41MCBDMjg3LjQ1LDE2NS4xNiAyODcuMDAsMTY1LjU4IDI4Ny4wMCwxNjYuNDQgQzI4Ny4wMCwxNjcuMzAgMjg3LjQ1LDE2OC4wMCAyODguMDAsMTY4LjAwIEMyODguNTUsMTY4LjAwIDI4OS4wMCwxNjcuNTggMjg5LjAwLDE2Ny4wNiBaIiBmaWxsPSJyZ2JhKDI0NCw4MywxNiwxKSIvPg0KPC9nPg0KPC9zdmc+";

	// ─── Props ────────────────────────────────────────────────────────────────────

	let { data } = $props();
	let payroll = $derived(data.payroll);

	// ─── Helpers ──────────────────────────────────────────────────────────────────

	const MONTH_NAMES = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	function monthName(month: number): string {
		return MONTH_NAMES[month - 1] ?? String(month);
	}

	function formatCurrency(amount: number): string {
		return '₹' + Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	let earnings = $derived(payroll.earnings ?? []);
	let deductions = $derived(payroll.deductions ?? []);
	let netPayWords = $derived(payroll.net_salary_words ?? '');
	let rowIndices = $derived(
		Array.from({ length: Math.max(earnings.length, deductions.length) }, (_, i) => i)
	);

	// ─── Actions ──────────────────────────────────────────────────────────────────

	function goBack() {
		goto(resolve(`/payroll-records/${payroll.cuid}`));
	}

	let isDownloading = $state(false);

	function getPngDataUrlFromSvg(svgDataUrl: string, size = 160): Promise<string> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(img, 0, 0, size, size);
					resolve(canvas.toDataURL('image/png'));
				} else {
					reject(new Error('Canvas context not available'));
				}
			};
			img.onerror = (e) => reject(e);
			img.src = svgDataUrl;
		});
	}

	function formatPdfCurrency(amount: number): string {
		return 'Rs. ' + Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	async function handleDownloadPdf() {
		if (isDownloading) return;
		isDownloading = true;

		try {
			const { jsPDF } = await import('jspdf');
			const logoPng = await getPngDataUrlFromSvg(favicon, 160);

			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'pt',
				format: 'a4'
			});

			const startX = 40;
			const startY = 40;
			const width = 515.28; // 595.28 (A4 width) - 80 (margins of 40 on each side)

			const headerH = 60;
			const empH = 136;
			const tableHeaderH = 24;
			const rowCount = Math.max(earnings.length, deductions.length);
			const tableRowsH = Math.max(rowCount, 1) * 18;
			const totalsH = 24;
			const netPayH = 42;
			const footerH = 30;

			const documentHeight = headerH + empH + tableHeaderH + tableRowsH + totalsH + netPayH + footerH;

			// Draw document boundary box
			pdf.setDrawColor(209, 213, 219); // #d1d5db
			pdf.setLineWidth(1);
			pdf.roundedRect(startX, startY, width, documentHeight, 6, 6);

			// --- Header Section ---
			// Logo
			pdf.addImage(logoPng, 'PNG', startX + 16, startY + 10, 40, 40);

			// Company name
			pdf.setFont('helvetica', 'bold');
			pdf.setFontSize(14);
			pdf.setTextColor(17, 24, 39); // #111827
			pdf.text('PieQ Technologies (India) Private Limited', startX + 70, startY + 26);

			// Subtitle / Period
			pdf.setFont('helvetica', 'normal');
			pdf.setFontSize(10.5);
			pdf.setTextColor(107, 114, 128); // #6b7280
			pdf.text(`Payslip For The Month Of ${monthName(payroll.month)} ${payroll.year}`, startX + 70, startY + 42);

			// Header bottom border (2px)
			pdf.setDrawColor(17, 24, 39); // #111827
			pdf.setLineWidth(2);
			pdf.line(startX, startY + headerH, startX + width, startY + headerH);

			// --- Employee Info Section ---
			const empStartY = startY + headerH;
			const ed = payroll.employee_details;
			const col1Fields = [
				{ label: 'Employee Name', value: payroll.employee_name },
				{ label: 'Employee Number', value: payroll.employee_code },
				{ label: 'Designation', value: ed?.designation ?? '—' },
				{ label: 'Location', value: ed?.location ?? '—' },
				{ label: 'Date Of Joining', value: ed?.date_of_joining ?? '—' },
				{ label: 'Bank Name', value: ed?.bank_name ?? '—' }
			];
			const col2Fields = [
				{ label: 'Bank Account No.', value: ed?.bank_account_number ?? '—' },
				{ label: 'PAN', value: ed?.pan ?? '—' },
				{ label: 'PF Account No.', value: ed?.pf_account_number ?? '—' },
				{ label: 'UAN', value: ed?.uan ?? '—' },
				{ label: 'Paid Days', value: ed?.paid_days ?? '—' },
				{ label: 'LOP Days', value: ed?.lop_days ?? '0' }
			];

			pdf.setFontSize(9);
			const lineH = 17;
			const maxEmpRows = Math.max(col1Fields.length, col2Fields.length);

			for (let i = 0; i < maxEmpRows; i++) {
				const y = empStartY + 12 + i * lineH;

				// Left Column
				if (i < col1Fields.length) {
					const field = col1Fields[i];
					pdf.setFont('helvetica', 'normal');
					pdf.setTextColor(107, 114, 128);
					pdf.text(field.label, startX + 16, y);

					pdf.setTextColor(156, 163, 175);
					pdf.text(':', startX + 120, y);

					pdf.setFont('helvetica', 'bold');
					pdf.setTextColor(17, 24, 39);
					pdf.text(String(field.value), startX + 128, y);
				}

				// Right Column
				if (i < col2Fields.length) {
					const field = col2Fields[i];
					pdf.setFont('helvetica', 'normal');
					pdf.setTextColor(107, 114, 128);
					pdf.text(field.label, startX + 275, y);

					pdf.setTextColor(156, 163, 175);
					pdf.text(':', startX + 375, y);

					pdf.setFont('helvetica', 'bold');
					pdf.setTextColor(17, 24, 39);
					pdf.text(String(field.value), startX + 383, y);
				}
			}

			// Middle column divider
			pdf.setDrawColor(229, 231, 235); // #e5e7eb
			pdf.setLineWidth(1);
			pdf.line(startX + 260, empStartY + 6, startX + 260, empStartY + empH - 6);

			// Employee section bottom border
			pdf.line(startX, empStartY + empH, startX + width, empStartY + empH);

			// --- Table Section ---
			const tableStartY = empStartY + empH;

			// Draw headers background
			pdf.setFillColor(249, 250, 251); // #f9fafb
			pdf.rect(startX, tableStartY, width, tableHeaderH, 'F');

			// Table headers text
			pdf.setFont('helvetica', 'bold');
			pdf.setFontSize(8.5);
			pdf.setTextColor(17, 24, 39);
			pdf.text('EARNINGS', startX + 16, tableStartY + 15);
			pdf.text('AMOUNT', startX + 244, tableStartY + 15, { align: 'right' });
			pdf.text('DEDUCTIONS', startX + 276, tableStartY + 15);
			pdf.text('AMOUNT', startX + 500, tableStartY + 15, { align: 'right' });

			// Header bottom border
			pdf.setDrawColor(229, 231, 235);
			pdf.line(startX, tableStartY + tableHeaderH, startX + width, tableStartY + tableHeaderH);

			// Center vertical column divider
			const tableTotalH = tableHeaderH + tableRowsH + totalsH;
			pdf.setDrawColor(209, 213, 219); // #d1d5db
			pdf.line(startX + 260, tableStartY, startX + 260, tableStartY + tableTotalH);

			// Draw table rows
			pdf.setFontSize(9);
			pdf.setDrawColor(243, 244, 246); // #f3f4f6 (lighter row dividers)

			for (let i = 0; i < Math.max(rowCount, 1); i++) {
				const y = tableStartY + tableHeaderH + i * 18;
				const rowEarning = earnings[i];
				const rowDeduction = deductions[i];

				// Earnings column
				if (rowEarning) {
					pdf.setFont('helvetica', 'normal');
					pdf.setTextColor(55, 65, 81); // #374151
					pdf.text(rowEarning[0], startX + 16, y + 12);
					pdf.setFont('helvetica', 'normal');
					pdf.setTextColor(17, 24, 39);
					pdf.text(formatPdfCurrency(rowEarning[1]), startX + 244, y + 12, { align: 'right' });
				}

				// Deductions column
				if (rowDeduction) {
					pdf.setFont('helvetica', 'normal');
					pdf.setTextColor(55, 65, 81);
					pdf.text(rowDeduction[0], startX + 276, y + 12);
					pdf.setFont('helvetica', 'normal');
					pdf.setTextColor(17, 24, 39);
					pdf.text(formatPdfCurrency(rowDeduction[1]), startX + 500, y + 12, { align: 'right' });
				}

				// Row bottom border
				pdf.setDrawColor(243, 244, 246);
				pdf.line(startX, y + 18, startX + width, y + 18);
			}

			if (rowCount === 0) {
				const y = tableStartY + tableHeaderH;
				pdf.setFont('helvetica', 'italic');
				pdf.setTextColor(156, 163, 175);
				pdf.text('No component breakdown available.', startX + width / 2, y + 12, { align: 'center' });
				pdf.line(startX, y + 18, startX + width, y + 18);
			}

			// --- Totals Row ---
			const totalsStartY = tableStartY + tableHeaderH + tableRowsH;

			// Totals background
			pdf.setFillColor(249, 250, 251); // #f9fafb
			pdf.rect(startX, totalsStartY, width, totalsH, 'F');

			// Top boundary line of totals (thick)
			pdf.setDrawColor(209, 213, 219); // #d1d5db
			pdf.setLineWidth(1.5);
			pdf.line(startX, totalsStartY, startX + width, totalsStartY);

			// Totals text
			pdf.setFont('helvetica', 'bold');
			pdf.setFontSize(8.5);
			pdf.setTextColor(17, 24, 39);
			pdf.text('GROSS EARNINGS', startX + 16, totalsStartY + 15);
			pdf.text(formatPdfCurrency(payroll.gross_earnings), startX + 244, totalsStartY + 15, { align: 'right' });

			pdf.text('TOTAL DEDUCTIONS', startX + 276, totalsStartY + 15);
			pdf.text(formatPdfCurrency(payroll.total_deduction), startX + 500, totalsStartY + 15, { align: 'right' });

			// --- Net Pay Section ---
			const netPayStartY = totalsStartY + totalsH;

			// Net Pay top border (2px)
			pdf.setDrawColor(17, 24, 39); // #111827
			pdf.setLineWidth(2);
			pdf.line(startX, netPayStartY, startX + width, netPayStartY);

			// Label
			pdf.setFont('helvetica', 'bold');
			pdf.setFontSize(8.5);
			pdf.setTextColor(107, 114, 128); // #6b7280
			pdf.text('NET PAY', startX + 16, netPayStartY + 14);

			// Words
			pdf.setFont('helvetica', 'oblique'); // Italic/Oblique
			pdf.setFontSize(8);
			pdf.setTextColor(107, 114, 128);
			pdf.text(`(${netPayWords})`, startX + 16, netPayStartY + 27);

			// Amount
			pdf.setFont('helvetica', 'bold');
			pdf.setFontSize(18);
			pdf.setTextColor(17, 24, 39);
			pdf.text(formatPdfCurrency(payroll.net_salary), startX + 500, netPayStartY + 26, { align: 'right' });

			// Net Pay bottom border (1px)
			pdf.setDrawColor(229, 231, 235);
			pdf.setLineWidth(1);
			pdf.line(startX, netPayStartY + netPayH, startX + width, netPayStartY + netPayH);

			// --- Footer ---
			const footerStartY = netPayStartY + netPayH;
			pdf.setFont('helvetica', 'oblique');
			pdf.setFontSize(8);
			pdf.setTextColor(156, 163, 175);
			pdf.text('This is a system generated payslip and does not require signature.', startX + width / 2, footerStartY + 18, { align: 'center' });

			pdf.save(`Payslip_${payroll.employee_code}_${monthName(payroll.month)}_${payroll.year}.pdf`);
		} catch (err) {
			console.error('PDF generation failed:', err);
			toast.error('Failed to generate PDF. Please try again.');
		} finally {
			isDownloading = false;
		}
	}

</script>

<svelte:head>
	<title>Payslip {payroll.employee_name} {monthName(payroll.month)} {payroll.year}</title>
</svelte:head>

<!-- ─── Screen-only page chrome ──────────────────────────────────────────────── -->
<div class="no-print w-full space-y-4 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex items-center gap-3">
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				class="h-9 w-9 text-muted-foreground hover:text-foreground"
				onclick={goBack}
				aria-label="Back to Payroll Record"
			>
				<ArrowLeftIcon class="size-4" />
			</Button>
			<div class="space-y-0.5">
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Payslip</h1>
				<p class="text-sm text-muted-foreground">
					{payroll.employee_name} · {monthName(payroll.month)} {payroll.year}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<Button
				id="btn_download_payslip"
				type="button"
				variant="default"
				class="gap-2 bg-[#F45310] text-white hover:bg-[#d4430a] disabled:opacity-60"
				onclick={handleDownloadPdf}
				disabled={isDownloading}
				aria-label="Download Payslip as PDF"
			>
				{isDownloading ? 'Generating…' : 'Download PDF'}
			</Button>
		</div>
	</div>
</div>

<!-- ─── Payslip Document ──────────────────────────────────────────────────────── -->
<div class="payslip-wrapper">
	<div class="payslip-doc" id="payslip_document">

		<!-- Header ─────────────────────────────────────────────────────────────── -->
		<div class="payslip-header">
			<div class="payslip-header-logo">
				<img src={favicon} alt="PieQ Logo" class="payslip-logo-img" />
			</div>
			<div class="payslip-header-text">
				<div class="payslip-company-name">PieQ Technologies (India) Private Limited</div>
				<div class="payslip-period">Payslip For The Month Of {monthName(payroll.month)} {payroll.year}</div>
			</div>
		</div>

		<!-- Employee Info ────────────────────────────────────────────────────────── -->
		<div class="payslip-emp-section">
			<div class="payslip-emp-col">
				<div class="payslip-field">
					<span class="payslip-label">Employee Name</span>
					<span class="payslip-colon">:</span>
					<span class="payslip-value">{payroll.employee_name}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">Employee Number</span>
					<span class="payslip-colon">:</span>
					<span class="payslip-value">{payroll.employee_code}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">Designation</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.designation ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.designation ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">Location</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.location ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.location ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">Date Of Joining</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.date_of_joining ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.date_of_joining ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">Bank Name</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.bank_name ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.bank_name ?? '—'}</span>
				</div>
			</div>
			<div class="payslip-emp-divider"></div>
			<div class="payslip-emp-col">
				<div class="payslip-field">
					<span class="payslip-label">Bank Account No.</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.bank_account_number ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.bank_account_number ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">PAN</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.pan ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.pan ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">PF Account No.</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.pf_account_number ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.pf_account_number ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">UAN</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.uan ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.uan ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">Paid Days</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.paid_days ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.paid_days ?? '—'}</span>
				</div>
				<div class="payslip-field">
					<span class="payslip-label">LOP Days</span>
					<span class="payslip-colon">:</span>
					<span class={payroll.employee_details?.lop_days !== null && payroll.employee_details?.lop_days !== undefined ? 'payslip-value' : 'payslip-value payslip-empty'}>{payroll.employee_details?.lop_days ?? '0'}</span>
				</div>
			</div>
		</div>

		<!-- Earnings & Deductions Table ─────────────────────────────────────────── -->
		<div class="payslip-breakdown-section">
			<table class="payslip-breakdown-table">
				<thead>
					<tr>
						<th class="payslip-th payslip-th-name payslip-th-earnings">Earnings</th>
						<th class="payslip-th payslip-th-amount">Amount</th>
						<th class="payslip-th payslip-th-name payslip-th-deductions">Deductions</th>
						<th class="payslip-th payslip-th-amount">Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each rowIndices as i (i)}
						{@const earning = earnings[i]}
						{@const deduction = deductions[i]}
						<tr class="payslip-breakdown-row">
							<td class="payslip-td payslip-td-name">{earning ? earning[0] : ''}</td>
							<td class="payslip-td payslip-td-amount">{earning ? formatCurrency(earning[1]) : ''}</td>
							<td class="payslip-td payslip-td-name">{deduction ? deduction[0] : ''}</td>
							<td class="payslip-td payslip-td-amount">{deduction ? formatCurrency(deduction[1]) : ''}</td>
						</tr>
					{/each}

					{#if rowIndices.length === 0}
						<tr>
							<td class="payslip-td payslip-td-empty" colspan="4">No component breakdown available.</td>
						</tr>
					{/if}
				</tbody>
				<tfoot>
					<tr class="payslip-totals-row">
						<td class="payslip-tf payslip-tf-label">Gross Earnings</td>
						<td class="payslip-tf payslip-tf-amount">{formatCurrency(payroll.gross_earnings)}</td>
						<td class="payslip-tf payslip-tf-label">Total Deductions</td>
						<td class="payslip-tf payslip-tf-amount">{formatCurrency(payroll.total_deduction)}</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<!-- Net Pay ─────────────────────────────────────────────────────────────── -->
		<div class="payslip-netpay-section">
			<div class="payslip-netpay-left">
				<div class="payslip-netpay-label">Net Pay</div>
				<div class="payslip-netpay-words">({netPayWords})</div>
			</div>
			<div class="payslip-netpay-amount">{formatCurrency(payroll.net_salary)}</div>
		</div>

		<!-- Footer ──────────────────────────────────────────────────────────────── -->
		<div class="payslip-footer">
			This is a system generated payslip and does not require signature.
		</div>

	</div>
</div>

<style>
	/* ── Wrapper ──────────────────────────────────────────────────────────────── */
	.payslip-wrapper {
		margin-top: 1.5rem;
		display: flex;
		justify-content: center;
	}

	/* ── Document ─────────────────────────────────────────────────────────────── */
	.payslip-doc {
		width: 100%;
		max-width: 900px;
		background: #ffffff;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
		font-family: 'Inter Variable', 'Inter', sans-serif;
		font-size: 13px;
		color: #111827;
	}

	/* ── Header ───────────────────────────────────────────────────────────────── */
	.payslip-header {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 24px;
		background: #ffffff;
		border-bottom: 2px solid #111827;
	}

	.payslip-header-logo {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
	}

	.payslip-logo-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.payslip-header-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.payslip-company-name {
		font-size: 15px;
		font-weight: 700;
		color: #111827;
		letter-spacing: -0.2px;
	}

	.payslip-period {
		font-size: 11.5px;
		font-weight: 500;
		color: #6b7280;
		letter-spacing: 0.2px;
	}

	/* ── Employee Info Section ────────────────────────────────────────────────── */
	.payslip-emp-section {
		display: grid;
		grid-template-columns: 1fr 1px 1fr;
		gap: 0;
		padding: 12px 24px;
		background: #ffffff;
		border-bottom: 1px solid #e5e7eb;
	}

	.payslip-emp-divider {
		background: #e5e7eb;
		margin: 0 20px;
	}

	.payslip-emp-col {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Inline label : value row */
	.payslip-field {
		display: flex;
		align-items: baseline;
		gap: 0;
		min-height: 20px;
	}

	.payslip-label {
		font-size: 12px;
		font-weight: 500;
		color: #6b7280;
		min-width: 140px;
		flex-shrink: 0;
	}

	.payslip-colon {
		font-size: 12px;
		color: #9ca3af;
		padding: 0 6px 0 0;
		flex-shrink: 0;
	}

	.payslip-value {
		font-size: 12.5px;
		font-weight: 600;
		color: #111827;
	}


	.payslip-empty {
		color: #d1d5db;
		font-weight: 400;
	}

	/* ── Breakdown Table ──────────────────────────────────────────────────────── */
	.payslip-breakdown-section {
		border-bottom: 1px solid #e5e7eb;
	}

	.payslip-breakdown-table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}

	.payslip-th {
		padding: 7px 14px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #111827;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.payslip-th-name {
		width: 35%;
		text-align: left;
	}

	.payslip-th-amount {
		width: 15%;
		text-align: right;
	}

	.payslip-th-earnings {
		border-right: 1px solid #e5e7eb;
	}

	.payslip-th-deductions {
		border-right: 1px solid #e5e7eb;
		border-left: 2px solid #d1d5db;
	}

	/* Column separator — earnings amount | deductions name */
	.payslip-breakdown-table th:nth-child(2) {
		border-right: 2px solid #d1d5db;
	}
	.payslip-breakdown-table td:nth-child(2) {
		border-right: 2px solid #e5e7eb;
	}

	.payslip-td {
		padding: 6px 14px;
		font-size: 12.5px;
		vertical-align: middle;
		border-bottom: 1px solid #f3f4f6;
	}

	.payslip-td-name {
		font-weight: 400;
		color: #374151;
		text-align: left;
		border-right: 1px solid #f3f4f6;
	}

	.payslip-td-amount {
		font-size: 12.5px;
		font-weight: 500;
		color: #111827;
		text-align: right;
		white-space: nowrap;
	}

	.payslip-td-empty {
		text-align: center;
		color: #9ca3af;
		padding: 20px;
		font-style: italic;
	}

	/* Totals footer */
	.payslip-totals-row .payslip-tf {
		padding: 8px 14px;
		font-size: 12px;
		font-weight: 700;
		background: #f9fafb;
		border-top: 2px solid #d1d5db;
		color: #111827;
	}

	.payslip-tf-label {
		text-align: left;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		border-right: 1px solid #e5e7eb;
	}

	.payslip-tf-amount {
		text-align: right;
		font-size: 12.5px;
		white-space: nowrap;
	}

	.payslip-totals-row td:nth-child(2) {
		border-right: 2px solid #d1d5db;
	}

	/* ── Net Pay Section ──────────────────────────────────────────────────────── */
	.payslip-netpay-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		background: #ffffff;
		border-top: 2px solid #111827;
		border-bottom: 1px solid #e5e7eb;
	}

	.payslip-netpay-left {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.payslip-netpay-label {
		font-size: 11px;
		font-weight: 700;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.8px;
	}

	.payslip-netpay-words {
		font-size: 10.5px;
		color: #6b7280;
		font-style: italic;
		font-weight: 400;
		max-width: 520px;
	}

	.payslip-netpay-amount {
		font-size: 24px;
		font-weight: 800;
		color: #111827;
		font-family: 'Inter Variable', 'Inter', sans-serif;
		letter-spacing: -0.5px;
	}

	/* ── Footer ───────────────────────────────────────────────────────────────── */
	.payslip-footer {
		padding: 10px 24px;
		text-align: center;
		font-size: 10.5px;
		color: #9ca3af;
		background: #ffffff;
		font-style: italic;
	}

	/* ── Print styles ─────────────────────────────────────────────────────────── */
	@media print {
		:global(.no-print) {
			display: none !important;
		}

		:global(aside),
		:global(nav),
		:global(header) {
			display: none !important;
		}

		:global(main) {
			padding: 0 !important;
			margin: 0 !important;
		}

		.payslip-wrapper {
			margin-top: 0;
		}

		.payslip-doc {
			max-width: 100%;
			border-radius: 0;
			border: none;
			box-shadow: none;
		}
	}
</style>
