<script lang="ts">
  import { onMount } from 'svelte';
  import { useConfig } from './utility/metadataLoaders';
  import ErrorInfo from './elements/ErrorInfo.svelte';
  import Link from './elements/Link.svelte';
  import { internalRedirectTo } from './clientAuth';
  import SpecialPageLayout from './widgets/SpecialPageLayout.svelte';
  import { _t } from './translations';

  const config = useConfig();

  const params = new URLSearchParams(location.search);
  const error = params.get('error');
</script>

<SpecialPageLayout>
  <div class="heading">{_t('errorPage.configurationError', { defaultMessage: 'Configuration error' })}</div>
  {#if $config?.checkedLicense?.status == 'error'}
    <ErrorInfo
      message={`${_t('errorPage.invalidLicense', { defaultMessage: 'Invalid license. Please contact sales@dbgate.eu for more details.' })} ${$config?.checkedLicense?.error}`}
    />
  {:else if $config?.configurationError}
    <ErrorInfo message={$config?.configurationError} />
  {:else if error}
    <ErrorInfo message={error} />
  {:else}
    <ErrorInfo message={_t('errorPage.noErrorFound', { defaultMessage: 'No error found, try to open app again' })} />
    <div class="m-2">
      <Link onClick={() => internalRedirectTo('/')}>{_t('errorPage.backToApp', { defaultMessage: 'Back to app' })}</Link>
    </div>
  {/if}
</SpecialPageLayout>

<style>
  .heading {
    text-align: center;
    margin: 1em;
    font-size: xx-large;
  }
</style>
