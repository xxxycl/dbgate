<script lang="ts">
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import { useConfig } from '../utility/metadataLoaders';
  import moment from 'moment';

  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import Link from '../elements/Link.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import { isProApp } from '../utility/proTools';
  import { _t } from '../translations';

  const config = useConfig();
  $: version = $config?.version;
  $: buildTime = $config?.buildTime;
</script>

<ModalBase {...$$restProps}>
  <svelte:fragment slot="header">{_t('aboutModal.title', { defaultMessage: 'About DbGate' })}</svelte:fragment>
  <div class="flex">
    <img src="logo192.png" />
    <div class="ml-4">
      <div>
        {_t('aboutModal.version', { defaultMessage: 'Version' })}: <span>{version}</span>
      </div>
      <div>
        {_t('aboutModal.buildDate', { defaultMessage: 'Build date' })}: <span>{moment(buildTime).format('YYYY-MM-DD')}</span>
      </div>
      <div>
        {_t('aboutModal.licenseType', { defaultMessage: 'License type' })}: <span
          >{$config?.checkedLicense && $config?.checkedLicense?.type != 'community'
            ? ($config?.checkedLicense?.licenseTypeObj?.name ?? _t('aboutModal.unknown', { defaultMessage: 'Unknown' }))
            : _t('aboutModal.community', { defaultMessage: 'Community' })}</span
        >
      </div>
      {#if $config?.checkedLicense?.users}
        <div>
          {_t('aboutModal.userCount', { defaultMessage: 'User count' })}: <span>{$config?.checkedLicense?.users}</span>
        </div>
      {/if}

      <div class="mt-2">
        <FontIcon icon="mdi mdi-web color-icon-blue" /> {_t('aboutModal.web', { defaultMessage: 'Web' })}: <Link href="https://dbgate.io">dbgate.io</Link>
      </div>
      {#if isProApp()}
        <div>
          <FontIcon icon="mdi mdi-email color-icon-red" /> {_t('aboutModal.support', { defaultMessage: 'Support' })}: <Link href="mailto:support@dbgate.io"
            >support@dbgate.io</Link
          >
        </div>
      {/if}
      <div>
        <FontIcon icon="mdi mdi-lightbulb color-icon-yellow" /> {_t('aboutModal.giveUsFeedback', { defaultMessage: 'Give us feedback' })}: <Link
          href="https://dbgate.io/feedback">dbgate.io/feedback</Link
        >
      </div>

      <div class="mt-2">
        {_t('aboutModal.sourceCodes', { defaultMessage: 'Source codes' })}: <Link href="https://github.com/dbgate/dbgate/">GitHub</Link>
      </div>
      <div>
        {_t('aboutModal.dockerContainer', { defaultMessage: 'Docker container' })}: <Link
          href={isProApp()
            ? 'https://hub.docker.com/r/dbgate/dbgate-premium'
            : 'https://hub.docker.com/r/dbgate/dbgate'}>Docker Hub</Link
        >
      </div>
      <!-- <div>
        Search plugins: <Link href="https://www.npmjs.com/search?q=keywords:dbgateplugin">npmjs.com</Link>
      </div> -->

      <div class="mt-2">
        {_t('aboutModal.producedBy', { defaultMessage: 'Produced by' })}: <span>Sprinx System a.s.</span>
      </div>
    </div>
  </div>

  <svelte:fragment slot="footer">
    <FormStyledButton value={_t('aboutModal.close', { defaultMessage: 'Close' })} on:click={closeCurrentModal} />
  </svelte:fragment>
</ModalBase>

<style>
  span {
    font-weight: bold;
  }
</style>
