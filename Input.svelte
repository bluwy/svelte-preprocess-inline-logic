<script>
  let bool = true;
  let bool2 = false
  let arr = ['foo']
</script>

<div :if={bool}>
  Hello
</div>
<div :else-if={bool2}>
  World
</div>
<div :else>
  !
</div>

<div :each={arr} :as={item, i} :key={item}>
  {item} {i}
</div>

<div :each={arr} :as={item, i} :key={item}>
  {item} {i}
</div>
<div :else>
  Hey
</div>

<div :await={Promise.resolve(0)} :then={result}>
  {result}
</div>
<div :catch={err}>
  {err}
</div>

<div :await={Promise.reject(0)} :catch={result}>
  {result}
</div>

<div :await={Promise.resolve(0)}>
  Hello
</div>
<div :then={result}>
  {result}
</div>
<div :catch={err}>
  {err}
</div>

<div :key={bool}>
  Hey
</div>