const chai = require('chai');
const chaiHttp = require('chai-http');
const { Configuration } = require('@hpi-schul-cloud/commons');

const app = require('../../../app');

const { expect } = chai;
const loginHelper = require('../helper/login-helper');
const { getStaticAssetPath } = require('../../../middleware/assets');

chai.use(chaiHttp);

// helper
const expectSuccessfulResponse = (err, res, resolve, stringToContain = 'User-agent') => {
	expect(err).to.be.equal(null);
	expect(res.statusCode).to.equal(200);
	expect(res.text).to.contain(stringToContain);
	resolve();
};


describe.only('Static assets middleware', () => {
	/**
     * using a sample file which exists in /static folder.
	 * the filename must contain a valid hash for the current file content,
	 * the hash can be safely updated when the file content changes
     */
	const ROBOTS_TXT_PATH_WITH_HASH = '/robots.3e9f0e3.txt';
	const ROBOTS_TXT_PATH = '/robots.txt';

	const INTEGRATION_PAGE_PATH = '/dashboard';
	const INTEGRATION_FILENAME = '/images/logo/lokalise_logo.svg';
	const INTEGRATION_HASHED_FILENAME = '/images/logo/lokalise_logo.76a4d05.svg';

	before((done) => {
		this.server = app.listen(3031);
		this.server.once('listening', () => {
			loginHelper.login(app).then((res) => {
				this.agent = res.agent;
				done();
			});
		});
	});

	after((done) => {
		this.server.close(done);
	});

	describe('unit tests', () => {
		describe('when having FEATURE_ASSET_CACHING_ENABLED enabled', () => {
			const configBefore = Configuration.toObject({ plainSecrets: true });
			before('enable FEATURE_ASSET_CACHING_ENABLED', () => {
				Configuration.set('FEATURE_ASSET_CACHING_ENABLED', true);
			});
			after('reset configuration', () => {
				Configuration.reset(configBefore);
			});
			it('get file path with hashes extended', () => {
				const filePath = getStaticAssetPath(ROBOTS_TXT_PATH);
				expect(filePath).to.be.equal(
					ROBOTS_TXT_PATH_WITH_HASH,
					'hash outdated, just any valid hash must be defined',
				);
			});
		});
		describe('when having FEATURE_ASSET_CACHING_ENABLED disabled', () => {
			const configBefore = Configuration.toObject({ plainSecrets: true });
			before('disable FEATURE_ASSET_CACHING_ENABLED', () => {
				Configuration.set('FEATURE_ASSET_CACHING_ENABLED', false);
			});
			after('reset configuration', () => {
				Configuration.reset(configBefore);
			});
			it('get file path with hashes extended', () => {
				const filePath = getStaticAssetPath(ROBOTS_TXT_PATH);
				expect(filePath).to.be.equal(ROBOTS_TXT_PATH);
			});
		});
	});
	describe('integration tests', () => {
		describe('when having FEATURE_ASSET_CACHING_ENABLED disabled', () => {
			const configBefore = Configuration.toObject({ plainSecrets: true });
			before('disable FEATURE_ASSET_CACHING_ENABLED', () => {
				Configuration.set('FEATURE_ASSET_CACHING_ENABLED', false);
			});
			after('reset configuration', () => {
				Configuration.reset(configBefore);
			});
			it('should not resolve assets with hashed name', () => new Promise((resolve) => {
				this.agent
					.get(ROBOTS_TXT_PATH_WITH_HASH)
					.end((err, res) => {
						expect(err).to.be.equal(null);
						expect(res.statusCode).to.equal(404);
						resolve();
					});
			}));
			it('should resolve assets with plain name', () => new Promise((resolve) => {
				this.agent
					.get(ROBOTS_TXT_PATH)
					.end((err, res) => {
						expectSuccessfulResponse(err, res, resolve);
					});
			}));
			it('should have plain filenames in hbs generated content', () => new Promise((resolve) => {
				this.agent
					.get(INTEGRATION_PAGE_PATH)
					.end((err, res) => {
						expectSuccessfulResponse(err, res, resolve, INTEGRATION_FILENAME);
					});
			}));
		});
		describe('when having FEATURE_ASSET_CACHING_ENABLED enabled', () => {
			const configBefore = Configuration.toObject({ plainSecrets: true });
			before('disable FEATURE_ASSET_CACHING_ENABLED', () => {
				Configuration.set('FEATURE_ASSET_CACHING_ENABLED', true);
			});
			after('reset configuration', () => {
				Configuration.reset(configBefore);
			});
			it('should resolve assets with hashed name and cache-control header beside of etag',
				() => new Promise((resolve) => {
					this.agent
						.get(ROBOTS_TXT_PATH_WITH_HASH)
						.end((err, res) => {
							expect(res.get('cache-control')).to.be.equal(
								'public, max-age=3600',
								'should have cache-control headers added',
							);
							expectSuccessfulResponse(err, res, resolve);
						});
				}));
			it('should resolve assets with plain name', () => new Promise((resolve) => {
				this.agent
					.get(ROBOTS_TXT_PATH)
					.end((err, res) => {
						expectSuccessfulResponse(err, res, resolve);
					});
			}));
			it('should have hashed filenames in hbs generated content', () => new Promise((resolve) => {
				this.agent
					.get(INTEGRATION_PAGE_PATH)
					.end((err, res) => {
						expectSuccessfulResponse(err, res, resolve, INTEGRATION_HASHED_FILENAME);
					});
			}));
		});
	});
});
