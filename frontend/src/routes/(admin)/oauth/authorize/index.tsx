import { component$ } from '@builder.io/qwik'
import * as access from 'wildebeest/backend/src/access'
import type { Client } from 'wildebeest/backend/src/mastodon/client'
import { getClientById } from 'wildebeest/backend/src/mastodon/client'
import { DocumentHead, loader$ } from '@builder.io/qwik-city'
import { WildebeestLogo } from '~/components/MastodonLogo'
import { Avatar } from '~/components/avatar'
import { Account } from '~/types'

export const clientLoader = loader$<{ DATABASE: D1Database }, Promise<Client>>(async ({ platform, query }) => {
	const client_id = query.get('client_id') || ''
	const client = await getClientById(platform.DATABASE, client_id)
	if (client === null) {
		throw new Error('client not found')
	}
	return client
})

export const userLoader = loader$<{ DATABASE: D1Database; domain: string }, Promise<{ email: string }>>(
	async ({ cookie }) => {
		const jwt = cookie.get('CF_Authorization')
		if (jwt === null) {
			throw new Error('missing authorization')
		}
		try {
			// TODO: eventually, verify the JWT with Access, however this
			// is not critical.
			const payload = access.getPayload(jwt.value)
			return { email: payload.email }
		} catch (err: unknown) {
			console.warn(err.stack)
			throw new Error('failed to validate Access JWT')
		}
	}
)

export default component$(() => {
	const client = clientLoader.use().value
	const user = userLoader.use().value
	return (
		<div class="flex flex-col p-4 items-center">
			<h1 class="text-center mt-3 mb-5 flex items-center">
				<WildebeestLogo size="medium" />
			</h1>
			<hr class="border-t-0 border-b border-wildebeest-700 w-full mb-10" />
			<div class="max-w-lg text-left">
				<div class="border-b border-wildebeest-700 pb-10 mx-auto mt-5 mb-[5rem] flex flex-wrap justify-between gap-4 items-center">
					<div class="grid grid-rows-[repeat(2,_1fr)] grid-cols-[max-content,_1fr] items-center">
						<div class="row-span-2 mr-4">
							<Avatar
								primary={
									{
										// TODO: fetch the avatar in the loader (using getPersonByEmail?)
										avatar:
											'https://files.mastodon.social/accounts/avatars/109/502/260/753/916/593/original/f721da0f38083abf.jpg',
									} as Account
								}
								secondary={null}
							/>
						</div>
						<p class="col-start-2">Signed in as:</p>
						<p class="col-start-2 font-bold">{user.email}</p>
					</div>
					<a
						class="no-underline col-start-3 row-span-full ml-auto"
						href="/cdn-cgi/access/logout"
						aria-label="Change Account"
					>
						<div class="text-wildebeest-500 opacity-40 hover:opacity-70 focus:opacity-70 flex items-baseline">
							<i class="fa fa-right-from-bracket text-[2.2rem]" />
						</div>
					</a>
				</div>
				<h2 class="text text-xl font-semibold mb-5">Authorization required</h2>
				<p class="mb-10">
					<strong class="text-[1rem]">{client.name}</strong>
					<span class="text-wildebeest-400">
						{' '}
						would like permission to access your account. It is a third-party application.
					</span>
					<strong class="text-[1rem]"> If you do not trust it, then you should not authorize it.</strong>
				</p>
				<h2 class="text text-xl font-semibold mb-5">Review permissions</h2>
				<div class="mb-5 grid grid-rows-[repeat(2,_1fr)] grid-cols-[max-content,_1fr] items-center bg-wildebeest-800 border border-wildebeest-600 p-4 rounded-md">
					<i class="fa-solid fa-check col-span-1 row-span-full text-[1.3rem] ml-2 mr-5 text-green-500 w-[1.5rem]"></i>
					<strong class="col-start-2">Everything</strong>
					<span class="col-start-2">Read and write access</span>
				</div>
				<form method="post" class="flex flex-col w-full">
					<button
						type="submit"
						class="mx-auto px-9 my-9 uppercase font-semibold bg-wildebeest-vibrant-600 hover:bg-wildebeest-vibrant-500 p-3 text-white text-uppercase border-wildebeest-vibrant-600 text-lg text-semi outline-none border rounded hover:border-wildebeest-vibrant-500 focus:border-wildebeest-vibrant-500"
					>
						Authorize
					</button>
				</form>
			</div>
		</div>
	)
})

export const head: DocumentHead = () => {
	return {
		title: 'Wildebeest Authorization required',
		meta: [
			{
				name: 'description',
				content: 'Wildebeest Authorization required',
			},
		],
	}
}
