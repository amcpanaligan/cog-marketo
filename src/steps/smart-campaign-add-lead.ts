/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class AddLeadToSmartCampaignStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Add Marketo Lead to Smart Campaign';
  protected stepExpression: string = 'add the (?<email>.+) marketo lead to smart campaign (?<campaign>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'the email address of the Marketo Lead',
  },
  {
    field: 'campaign',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'either the name of the smart campaign, or its numeric ID',
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email = stepData.email;
    const campaign = stepData.campaign;
    let campaigns = [{ id:campaign, isRequestable:true }];

    try {
      if (isNaN(campaign)) {
        const allCampaigns = await this.client.getCampaigns();
        campaigns = allCampaigns.result.filter(c => c.name.toLowerCase() == campaign.toLowerCase());
        console.log(campaigns);
      }

      if (campaigns.length != 1) {
        return this.error("Can't add %s to %s: found more than one campaign with that name.", [email, campaign[0]]);
      } else if (campaigns[0].hasOwnProperty('isRequestable') && !campaigns[0].isRequestable) {
        return this.error("Cannot add lead to smart campaign %s. In order to test this campaign, you must add a 'Campaign is Requested' trigger with 'Source' set to 'Web Service API'", [campaign]);
      }

      const lead: any = await this.client.findLeadByEmail(email);
      const result = await this.client.addLeadToSmartCampaign(campaigns[0].id.toString(), lead.result[0]);
      if (result.success) {
        return this.pass('Successfully added lead %s to smart campaign %s', [lead.result[0].email, campaigns[0].id.toString()]);
      } else {
        return this.fail('Unable to add lead %s to smart campaign %s', [lead.result[0].email, campaigns[0].id.toString()]);
      }
    } catch (e) {
      return this.error('%s', [e.toString()]);
    }
  }

}

export { AddLeadToSmartCampaignStep as Step };
