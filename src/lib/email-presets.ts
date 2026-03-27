export type PresetTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export type PresetSignature = {
  id: string;
  name: string;
  content: string;
  contentHtml: string;
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "preset:check-in-gold",
    name: "Check-in (Gold — with calendar link)",
    subject: "Quick check-in on your Dodo Payments account",
    body: `Hi {{name}},

This is Purrvi, your Account Manager from Dodo Payments. I noticed your account is live, but it looks like you haven't transacted with us for a while, so I wanted to quickly check in.

Is there anything currently holding you back from moving forward? You can simply reply with the number that fits best, no explanation needed.

1. Finalizing setup or preparing for launch
2. Waiting for a specific Dodo feature
3. Switched to another payment provider
4. Questions about fees, taxes, or payouts
5. Something else

If you need any help, feel free to reply to this email or book a time with me directly using the link: https://cal.dodopayments.com/purrvi/15min`,
  },
  {
    id: "preset:check-in-silver",
    name: "Check-in (Silver — reply only)",
    subject: "Quick check-in on your Dodo Payments account",
    body: `Hi {{name}},

This is Purrvi, your Account Manager from Dodo Payments. I noticed your account is live, but it looks like you haven't transacted with us for a while, so I wanted to quickly check in.

Is there anything currently holding you back from moving forward? You can simply reply with the number that fits best, no explanation needed.

1. Finalizing setup or preparing for launch
2. Waiting for a specific Dodo feature
3. Switched to another payment provider
4. Questions about fees, taxes, or payouts
5. Something else

If you need any help, feel free to reply to this email & I'll take it from there.`,
  },
  {
    id: "preset:churn-follow-up",
    name: "Churn Follow-up",
    subject: "Quick follow-up 🚀",
    body: `Hi,

Just following up on my previous email in case it got buried in your inbox.

This is Purrvi, your Account Manager from Dodo Payments. I noticed that your Dodo Payments account is live, but there hasn't been any recent activity yet. I wanted to check if there's anything blocking you from getting started or if there's something we can help with on our end.

1. Finalizing setup or preparing for launch
2. Waiting for a specific Dodo feature
3. Switched to another payment provider
4. Questions about fees, taxes, or payouts
5. Something else

Even a quick reply with a number helps me make sure we're supporting you in the best way possible.

Happy to help with setup, clarify anything, or point you to the right resources if needed.

Best,`,
  },
];

export const PRESET_SIGNATURES: PresetSignature[] = [
  {
    id: "preset:vansh-signature",
    name: "Vansh Jaiswal — Dodo Payments",
    content: `Vansh Jaiswal
Customers and Community
Book time here
+1 646-240-5987
vansh@dodopayments.com
www.dodopayments.com`,
    contentHtml: `<div dir="ltr">
  <table cellpadding="0" cellspacing="0" border="0" style="color:rgb(34,34,34);vertical-align:-webkit-baseline-middle">
    <tbody>
      <tr>
        <td style="vertical-align:middle">
          <h2 style="margin:0px;font-size:18px;color:rgb(13,13,13)"><strong>Vansh Jaiswal</strong></h2>
          <p style="margin:0px;color:rgb(13,13,13);font-size:14px;line-height:22px">Customers and Community</p>
          <p style="margin:0px;font-size:14px;line-height:22px"><em><a href="https://cal.dodopayments.com/vansh/15min" style="color:rgb(13,13,13)" target="_blank">Book time here</a></em></p>
        </td>
        <td width="30"><div style="width:30px"></div></td>
        <td width="1" style="width:1px;border-left:1px solid rgb(13,13,13)"></td>
        <td width="30"><div style="width:30px"></div></td>
        <td style="vertical-align:middle">
          <table cellpadding="0" cellspacing="0" border="0">
            <tbody>
              <tr height="25" style="vertical-align:middle">
                <td style="padding:0px;color:rgb(13,13,13)">+1 646-240-5987</td>
              </tr>
              <tr height="25" style="vertical-align:middle">
                <td style="padding:0px"><a href="mailto:vansh@dodopayments.com" target="_blank">vansh@dodopayments.com</a></td>
              </tr>
              <tr height="25" style="vertical-align:middle">
                <td style="padding:0px"><a href="https://dodopayments.com/" style="color:rgb(13,13,13)" target="_blank">www.dodopayments.com</a></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <div style="height:8px"></div>
  <a href="https://dodopayments.com/" target="_blank"><img src="https://drive.google.com/thumbnail?id=1cK6bllgvXpKQGc7FS7dDLlPw7k-zNwxX&sz=w1000" alt="Dodo Payments" border="0" width="420" height="57"></a>
</div>`,
  },
  {
    id: "preset:purrvi-signature",
    name: "Purrvi — Dodo Payments",
    content: `Purrvi
Customers and Community
+1 646-240-5987
purrvi@dodopayments.com
www.dodopayments.com`,
    contentHtml: `<div dir="ltr">
  <table cellpadding="0" cellspacing="0" border="0" style="color:rgb(34,34,34);vertical-align:-webkit-baseline-middle">
    <tbody>
      <tr>
        <td style="vertical-align:middle">
          <h2 style="margin:0px;font-size:18px;color:rgb(13,13,13)">Purrvi</h2>
          <p style="margin:0px;color:rgb(13,13,13);font-size:14px;line-height:22px">Customers and Community</p>
        </td>
        <td width="30"><div style="width:30px"></div></td>
        <td width="1" style="width:1px;border-left:1px solid rgb(13,13,13)"></td>
        <td width="30"><div style="width:30px"></div></td>
        <td style="vertical-align:middle">
          <table cellpadding="0" cellspacing="0" border="0">
            <tbody>
              <tr height="25" style="vertical-align:middle">
                <td style="padding:0px;color:rgb(13,13,13)">+1 646-240-5987</td>
              </tr>
              <tr height="25" style="vertical-align:middle">
                <td style="padding:0px"><a href="mailto:purrvi@dodopayments.com" target="_blank">purrvi@dodopayments.com</a></td>
              </tr>
              <tr height="25" style="vertical-align:middle">
                <td style="padding:0px"><a href="https://dodopayments.com/" style="color:rgb(13,13,13)" target="_blank">www.dodopayments.com</a></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <div style="height:8px"></div>
  <a href="https://dodopayments.com/" target="_blank"><img src="https://drive.google.com/thumbnail?id=1cK6bllgvXpKQGc7FS7dDLlPw7k-zNwxX&sz=w1000" alt="Dodo Payments" border="0" width="420" height="57"></a>
</div>`,
  },
];

export function findPresetTemplate(id: string): PresetTemplate | undefined {
  return PRESET_TEMPLATES.find((t) => t.id === id);
}

export function findPresetSignature(id: string): PresetSignature | undefined {
  return PRESET_SIGNATURES.find((s) => s.id === id);
}

export function isPresetId(id: string): boolean {
  return id.startsWith("preset:");
}
