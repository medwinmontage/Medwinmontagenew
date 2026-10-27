'use client';
import { useState } from 'react';
import PolicyModal from './PolicyModal';
import Icon from './Icon';
import BrandIcon, { BrandName } from './BrandIcon';
import { telHref, whatsappHref } from '@/lib/links';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_MARK } from '@/lib/brand';

type Content = {
  whatsappNumber?: string; logoUrl?: string;
  contactAddress: string; contactPhone: string; contactEmail: string; contactHours: string;
  socialInstagram: string; socialFacebook: string; socialYoutube: string; socialLinkedin: string; socialTwitter: string;
  privacyMode: string; privacyText: string; privacyUrl: string;
  termsMode: string; termsText: string; termsUrl: string;
  refundMode: string; refundText: string; refundUrl: string;
};
type PolicyKey = 'privacy' | 'terms' | 'refund';

export default function Footer({ content, about, serviceAreas }: { content: Content; about?: string; serviceAreas?: string[] }) {
  const [policy, setPolicy] = useState<PolicyKey | null>(null);
  // Only platforms with a link are shown, each with its real logo.
  const social = ([
    ['instagram', 'Instagram', content.socialInstagram], ['facebook', 'Facebook', content.socialFacebook], ['youtube', 'YouTube', content.socialYoutube],
    ['linkedin', 'LinkedIn', content.socialLinkedin], ['x', 'X (Twitter)', content.socialTwitter],
  ] as [BrandName, string, string][]).filter(([, , url]) => /^https?:\/\//i.test(url || ''));
  const tel = telHref(content.contactPhone);
  const wa = whatsappHref(content.whatsappNumber);

  // A policy set to "link external URL" opens that link; otherwise its text opens in a dialog.
  function showPolicy(key: PolicyKey) {
    const url = content[`${key}Url`];
    if (content[`${key}Mode`] === 'url' && url) window.open(url, '_blank', 'noopener');
    else setPolicy(key);
  }

  return (
    <footer id="contact" className="relative bg-paper-2 pt-20 pb-8">
      <hr className="divider absolute top-0 inset-x-0" />
      <div className="container-x">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_.8fr_.9fr] gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src={content.logoUrl || BRAND_MARK} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
              <span className="leading-none">
                <span className="block font-display font-extrabold text-lg tracking-tight">{BRAND_NAME}</span>
                <span className="block mt-1.5 text-xs font-semibold text-muted">{BRAND_TAGLINE}</span>
              </span>
            </div>
            <p className="text-sm text-muted max-w-[300px]">{about || 'Video editing, videography, photography, AI content, design, websites and digital marketing — from one freelance team.'}</p>
            {serviceAreas && serviceAreas.length > 0 && <p className="text-xs text-muted max-w-[300px] mt-3">Serving {serviceAreas.join(', ')}.</p>}
            {social.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-5" aria-label="Social media">
                {social.map(([icon, name, url]) => (
                  <li key={icon}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Medwin Montage on ${name} (opens in a new tab)`} title={name} className="icon-btn social-btn !rounded-full">
                      <BrandIcon name={icon} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="font-sans text-sm font-extrabold tracking-normal mb-4">Get in touch</h2>
            <ul className="text-sm flex flex-col gap-3.5">
              {content.contactAddress && (
                <li className="flex gap-3 items-start">
                  <Icon name="pin" className="w-[18px] h-[18px] mt-0.5 flex-shrink-0 text-accent-ink" />
                  <address className="not-italic text-ink-2 break-words min-w-0">{content.contactAddress}</address>
                </li>
              )}
              {content.contactPhone && (
                <li className="flex gap-3 items-start">
                  <Icon name="phone" className="w-[18px] h-[18px] mt-0.5 flex-shrink-0 text-accent-ink" />
                  {tel ? <a href={tel} className="link-plain text-ink-2 font-semibold" aria-label={`Call Medwin Montage on ${content.contactPhone}`}>{content.contactPhone}</a> : <span className="text-ink-2">{content.contactPhone}</span>}
                </li>
              )}
              {wa && (
                <li className="flex gap-3 items-start">
                  <BrandIcon name="whatsapp" className="w-[18px] h-[18px] mt-0.5 flex-shrink-0 text-accent-ink" />
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="link-plain text-ink-2 font-semibold" aria-label="Contact Medwin Montage on WhatsApp">WhatsApp {content.whatsappNumber}</a>
                </li>
              )}
              {content.contactEmail && (
                <li className="flex gap-3 items-start">
                  <Icon name="mail" className="w-[18px] h-[18px] mt-0.5 flex-shrink-0 text-accent-ink" />
                  <a href={`mailto:${content.contactEmail}`} className="link-plain text-ink-2 break-all min-w-0">{content.contactEmail}</a>
                </li>
              )}
              {content.contactHours && (
                <li className="flex gap-3 items-start">
                  <Icon name="clock" className="w-[18px] h-[18px] mt-0.5 flex-shrink-0 text-accent-ink" />
                  <span className="text-ink-2">{content.contactHours}</span>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="font-sans text-sm font-extrabold tracking-normal mb-4">Quick links</h2>
            <ul className="text-sm text-ink-2 flex flex-col gap-3">
              <li><a href="#about" className="link-plain">About</a></li>
              <li><a href="#services" className="link-plain">Services</a></li>
              <li><a href="#portfolio" className="link-plain">Portfolio</a></li>
              <li><a href="#packages" className="link-plain">Packages</a></li>
              <li><a href="/join-as-crew" className="link-plain">Join as Crew</a></li>
              <li><a href="/account" className="link-plain">My Account</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-sans text-sm font-extrabold tracking-normal mb-4">Legal</h2>
            <ul className="text-sm text-ink-2 flex flex-col gap-3 items-start">
              <li><button type="button" className="link-plain" onClick={() => showPolicy('privacy')}>Privacy Policy</button></li>
              <li><button type="button" className="link-plain" onClick={() => showPolicy('terms')}>Terms &amp; Conditions</button></li>
              <li><button type="button" className="link-plain" onClick={() => showPolicy('refund')}>Refund Policy</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line pt-6 text-xs text-muted">
          © {new Date().getFullYear()} Medwin Montage. All rights reserved.
        </div>
      </div>
      <PolicyModal policyKey={policy} content={content} onClose={() => setPolicy(null)} />
    </footer>
  );
}
