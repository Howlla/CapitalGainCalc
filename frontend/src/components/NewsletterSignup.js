import React from 'react';

export default function NewsletterSignup() {
  const username = 'bhavye';

  return (
    <section id="newsletter" className="newsletter" aria-labelledby="newsletter-heading">
      <div className="newsletter__container">
        <h2 id="newsletter-heading">Get notified of the latest feature updates</h2>
        <p className="newsletter__subtitle">
          Join the list for early access, feature previews, and tax savings tips. No spam.
        </p>

        <form
          action={`https://buttondown.email/api/emails/embed-subscribe/${username}`}
          method="post"
          target="popupwindow"
          onSubmit={() =>
            window.open(`https://buttondown.email/${username}`, 'popupwindow')
          }
          className="embeddable-buttondown-form newsletter__form"
        >
          <label htmlFor="bd-email" className="sr-only">Email address</label>
          <input
            type="email"
            name="email"
            id="bd-email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={{ textAlign: 'center' }} // center placeholder (and input text)
          />
          <input type="hidden" value="1" name="embed" />
          <button type="submit">Subscribe</button>
        </form>

        <p className="newsletter__fineprint">Unsubscribe anytime.</p>
      </div>
    </section>
  );
}