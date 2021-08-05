<script>
  let bool = true;
  let bool2 = false
  let arr = ['foo']
</script>

{#if bool}<div >
  Hello
</div>
{:else if bool2}<div >
  World
</div>
{:else}<div >
  !
</div>{/if}

{#each arr as item, i (item)}<div   >
  {item} {i}
</div>{/each}

{#each arr as item, i (item)}<div   >
  {item} {i}
</div>
{:else}<div >
  Hey
</div>{/each}

{#await Promise.resolve(0) then result}<div  >
  {result}
</div>
{:catch}<div >
  {err}
</div>{/await}

{#await Promise.reject(0) catch result}<div  >
  {result}
</div>{/await}

{#await Promise.resolve(0)}<div >
  Hello
</div>
{:then result}<div >
  {result}
</div>
{:catch}<div >
  {err}
</div>{/await}

{#key bool}<div >
  Hey
</div>{/key}