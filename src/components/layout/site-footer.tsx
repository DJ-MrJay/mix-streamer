import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTelegram,
  faFacebook,
  faXTwitter,
  faMixcloud,
} from "@fortawesome/free-brands-svg-icons";

type SocialLink = {
  href: string;
  label: string;
  icon: IconDefinition;
};

const iconClassName = "size-5";

const socialLinks: SocialLink[] = [
  {
    href: "https://t.me/djmrjaymixtapes",
    label: "Telegram",
    icon: faTelegram,
  },
  {
    href: "https://www.mixcloud.com/djmrjay",
    label: "Mixcloud",
    icon: faMixcloud,
  },

  {
    href: "https://x.com/dj_mrjay",
    label: "X",
    icon: faXTwitter,
  },
  {
    href: "https://www.facebook.com/djmrjay.ke/",
    label: "Facebook",
    icon: faFacebook,
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-player-footer
      className="border-t border-border bg-background px-4 py-6 text-center text-muted-foreground"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-4 text-xl">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="text-muted-foreground transition hover:text-foreground"
            >
              <FontAwesomeIcon icon={link.icon} className={iconClassName} />
            </a>
          ))}
        </div>

        <p className="text-xs">&copy; {year} DJ Mr. Jay Mixtapes. All rights reserved.</p>

        <p className="text-xs">
          Developed and carefully curated by{" "}
          <a
            href="https://dj.mrjay.co.ke/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 transition hover:underline"
          >
            Mr. Jay
          </a>
        </p>
      </div>
    </footer>
  );
}
