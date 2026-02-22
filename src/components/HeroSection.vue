<template>
  <section class="hero">
    <p class="eyebrow">Men's shirt print studio</p>
    <h1>Create, price, and submit shirt print orders in one screen.</h1>
    <p>
      Pick a shirt color, drop artwork on the shirt, then send the full order to your printing email with pricing and
      customer details.
    </p>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(125deg, #11334a, #0d5f55 58%, #1a8f64);
  color: #f9fafb;
  border-radius: 20px;
  padding: 1.25rem;
  box-shadow: 0 18px 38px rgba(11, 33, 42, 0.18);
}

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
  font-weight: 800;
  opacity: 0.9;
}

.hero h1 {
  margin: 0.45rem 0;
  font-size: clamp(1.3rem, 4vw, 2rem);
  line-height: 1.18;
  font-weight: 800;
}

.hero p {
  margin: 0;
  max-width: 68ch;
}

@media (min-width: 800px) {
  .hero {
    padding: 1.7rem;
  }
}
</style>
