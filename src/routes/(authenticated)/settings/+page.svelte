<script lang="ts">
  import ConfigForm from "$lib/components/ConfigForm.svelte";
  import ProjectSelector from "$lib/components/projectSelector/projectSelector.svelte";
</script>

<svelte:head>
  <title>Settings - GitHub PR Management</title>
</svelte:head>

<ProjectSelector />
<ConfigForm />
